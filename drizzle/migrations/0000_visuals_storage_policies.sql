create policy "Users can view own visuals"
on storage.objects for select to authenticated
using (bucket_id = 'visuals' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload own visuals"
on storage.objects for insert to authenticated
with check (bucket_id = 'visuals' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own visuals"
on storage.objects for delete to authenticated
using (bucket_id = 'visuals' and (storage.foldername(name))[1] = auth.uid()::text);