
'use client'

interface Props {
  selected: string
  onSelect: (avatar: string) => void
}

const avatars = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-yellow-500',
]

export default function AvatarPicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-5 gap-4">
      {avatars.map((a) => (
        <button
          key={a}
          onClick={() => onSelect(a)}
          className={`w-12 h-12 rounded-full ${a} ${
            selected === a ? 'ring-2 ring-white' : ''
          }`}
        />
      ))}
    </div>
  )
}
