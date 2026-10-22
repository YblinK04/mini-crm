import { PublicChat } from '@/components/chat/public/PublicChat';

export default async function PublicChatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = await params;

  return (
    <div className="flex h-[100dvh] w-full bg-background items-center justify-center">
      <div className="w-full h-full flex flex-col bg-background">
        <PublicChat token={resolvedParams.token} />
      </div>
    </div>
  );
}