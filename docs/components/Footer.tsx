import TwitterIcon from "../icons/Twitter.svg";
import { ResponsiveBreakpoint } from "../utils/style-constants";

export const Footer = () => {
  return (
    <footer>
      <div className="footer-inner spread">
        <a href="https://glow.app">
          <img className="dark" src="/glow-logo-dark.svg" />
          <img className="light" src="/glow-logo-light.svg" />
        </a>

        <a
          href="https://twitter.com/glowwallet"
          target="_blank"
          className="twitter luma-button link rounded round icon-only"
        >
          <TwitterIcon />
        </a>
      </div>

      <style jsx>{`
        footer {
          padding: 2rem 1.5rem;
          background-color: var(--tertiary-bg-color);
        }

        .footer-inner {
          width: 100%;
          max-width: 52rem;
          margin: 0 auto;
        }

        footer img {
          display: block;
          height: 1.5rem;
        }

        footer img.light {
          display: none;
        }

        footer .twitter {
          margin-bottom: 0.25rem;
        }

        footer .twitter :global(svg) {
          height: 1.25rem;
          width: 1.25rem;
        }

        @media (prefers-color-scheme: dark) {
          footer img.light {
            display: block;
          }

          footer img.dark {
            display: none;
          }
        }

        @media (max-width: ${ResponsiveBreakpoint.medium}) {
          footer {
            padding: 1.25rem 1.5rem;
          }
        }
      `}</style>
    </footer>
  );
};