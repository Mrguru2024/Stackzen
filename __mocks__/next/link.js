import React from 'react';
export default function Link({ href, children, ...props }) {
  return <a href={href} role="link" {...props}>{children}</a>;
}
