import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Square, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { transcribeRecording } from "@/lib/files.functions";
import { MAX_UPLOAD_BYTES, blobToBase64 } from "@/lib/media";

/**
 * Records a voice note (or accepts an audio file), transcribes it through
 * Lovable AI and hands the text back to the caller.
 */
export function VoiceInput({
  onTranscript,
  label = "Dictate",
  allowUpload = true,
  disabled,
  size = "sm",
}: {
  onTranscript: (text: string) => void;
  label?: string;
  allowUpload?: boolean;
  disabled?: boolean | undefined;
  size?: "sm" | "icon";
}) {
  const transcribe = useServerFn(transcribeRecording);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async (blob: Blob, fileName?: string) => {
    if (blob.size === 0) {
      toast.error("Nothing was recorded.");
      return;
    }
    if (blob.size > MAX_UPLOAD_BYTES) {
      toast.error("That recording is larger than 20MB.");
      return;
    }
    setBusy(true);
    try {
      const dataBase64 = await blobToBase64(blob);
      const result = await transcribe({
        data: {
          dataBase64,
          mimeType: blob.type || "audio/webm",
          ...(fileName ? { fileName } : {}),
        },
      });
      if (result.text.trim()) {
        onTranscript(result.text.trim());
        toast.success("Transcribed");
      }
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "The recording could not be transcribed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void send(new Blob(chunksRef.current, { type: mimeType }));
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error("Microphone access is needed to record a voice note.");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <Button
        type="button"
        size={size}
        variant={recording ? "destructive" : "outline"}
        disabled={busy || disabled}
        aria-label={recording ? "Stop recording" : label}
        onClick={() => (recording ? stop() : void start())}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : recording ? (
          <Square className="size-4" aria-hidden="true" />
        ) : (
          <Mic className="size-4" aria-hidden="true" />
        )}
        {size === "sm" ? (busy ? "Transcribing…" : recording ? "Stop" : label) : null}
      </Button>
      {allowUpload ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void send(file, file.name);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={busy || recording || disabled}
            aria-label="Upload an audio file"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" aria-hidden="true" />
          </Button>
        </>
      ) : null}
    </div>
  );
}
