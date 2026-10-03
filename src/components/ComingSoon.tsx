export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">준비 중인 페이지예요.</p>
    </div>
  );
}
