import * as React from "react"

export function Card({

  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />
}


