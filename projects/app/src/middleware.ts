import { NextResponse, type NextRequest } from 'next/server';

const timeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

const formatAccessTime = (date: Date) => {
  const parts = Object.fromEntries(timeFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}+08:00`;
};

export function middleware(request: NextRequest) {
  const time = formatAccessTime(new Date());
  const url = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  console.log(`[access] ${time} ${request.method} ${url}`);

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
