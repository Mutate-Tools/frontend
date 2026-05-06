
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ChatBg1 bg-cover bg-no-repeat">
      {children}
    </div>
  );
}
