import { siteConfig } from '@/config/site'

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} {siteConfig.name}. Built with{' '}
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Next.js 14
          </a>
          . Powered by{' '}
          <a
            href="https://www.keycloak.org/"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Keycloak
          </a>
          .
        </p>
        <p className="text-sm text-muted-foreground">v{siteConfig.version}</p>
      </div>
    </footer>
  )
}

