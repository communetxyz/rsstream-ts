const toColor = url => {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    hash = url.charCodeAt(i) + ((hash << 5) - hash)
  }

  let color = "#"
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xff
    if (value > 80) value -= 80
    color += `00${value.toString(16)}`.slice(-2)
  }
  return color
}

export const urlAvatar = url => {
  return {
    sx: {
      bgcolor: toColor(url),
    },
    children: url.match(/https?:\/\/(?:www\.|(?:.*?))(.)/)[1].toUpperCase(),
  }
}
