'use client'
import Image from 'next/image'
import { useState } from 'react'
import type { TeamInfo } from '@/types'
import { cn } from '@/lib/utils'

interface TeamLogoProps {
  team: TeamInfo
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: { px: 28, text: 'text-[9px]' },
  md: { px: 40, text: 'text-xs' },
  lg: { px: 56, text: 'text-sm' },
}

export function TeamLogo({ team, size = 'md', className }: TeamLogoProps) {
  const [imgError, setImgError] = useState(false)
  const { px, text } = SIZE_MAP[size]

  if (imgError) {
    return (
      <span
        className={cn('inline-flex items-center justify-center rounded-full font-bold text-white shrink-0', text, className)}
        style={{ width: px, height: px, backgroundColor: team.color }}
      >
        {team.abbreviation}
      </span>
    )
  }

  return (
    <Image
      src={team.logoUrl}
      alt={team.name}
      width={px}
      height={px}
      className={cn('rounded-full shrink-0', className)}
      onError={() => setImgError(true)}
      unoptimized
    />
  )
}
