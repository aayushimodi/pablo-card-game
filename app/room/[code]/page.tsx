import RoomPageClient from './RoomPageClient'

interface PageProps {
  params: { code: string }
}

export default function Page({ params }: PageProps) {
  return <RoomPageClient code={params.code} />
}
