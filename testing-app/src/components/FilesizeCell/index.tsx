'use client'

import React from 'react'

/**
 * Format raw bytes into human readable or grouped digits string.
 * e.g. 1245678 -> "1 245 678 B (1.19 MB)" or formatted with locale
 */
export function formatFilesize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) {
    return '—'
  }
  if (bytes === 0) return '0 B'

  // Format with space-separated thousand grouping
  const formattedNumber = bytes.toLocaleString('uk-UA')

  // Calculate friendly unit
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const unitIndex = Math.min(i, units.length - 1)
  const friendly =
    unitIndex > 0
      ? (bytes / Math.pow(k, unitIndex)).toFixed(unitIndex >= 2 ? 2 : 1) + ' ' + units[unitIndex]
      : ''

  return friendly ? `${formattedNumber} (${friendly})` : `${formattedNumber} B`
}

export type FilesizeCellProps = {
  cellData?: number | null
  rowData?: {
    filesize?: number | null
    [key: string]: unknown
  }
}

export const FilesizeCell: React.FC<FilesizeCellProps> = ({ cellData, rowData }) => {
  const size = typeof cellData === 'number' ? cellData : rowData?.filesize
  const label = formatFilesize(size)

  return (
    <span
      className="filesize-cell"
      style={{
        display: 'block',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
        whiteSpace: 'nowrap',
        paddingRight: '0.5rem',
      }}
      title={typeof size === 'number' ? `${size} bytes` : undefined}
    >
      {label}
    </span>
  )
}

export default FilesizeCell
