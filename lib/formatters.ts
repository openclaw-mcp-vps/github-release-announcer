import type {
  FormattedAnnouncement,
  GitHubReleaseEventPayload,
  ReleaseTemplateVariables
} from "@/lib/types";

const DEFAULT_TEMPLATE =
  "🚀 {repo} just released {tag}.\n\n{name}\n\n{notes}\n\nRead full release notes: {url}";

const PLACEHOLDER_PATTERN = /\{(repo|repoUrl|tag|name|notes|url|author|publishedAt)\}/g;

function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(input: string, maxChars: number): string {
  if (input.length <= maxChars) {
    return input;
  }
  return `${input.slice(0, maxChars - 1)}…`;
}

function makeVariables(payload: GitHubReleaseEventPayload): ReleaseTemplateVariables {
  const notes = (payload.release.body || "").trim();

  return {
    repo: payload.repository.full_name,
    repoUrl: payload.repository.html_url,
    tag: payload.release.tag_name,
    name: payload.release.name || `${payload.repository.name} ${payload.release.tag_name}`,
    notes: notes || "Release notes are available in GitHub.",
    url: payload.release.html_url,
    author: payload.release.author?.login || payload.sender?.login || payload.repository.owner.login,
    publishedAt: payload.release.published_at || new Date().toISOString()
  };
}

export function renderTemplate(
  template: string | undefined,
  variables: ReleaseTemplateVariables
): string {
  const source = template && template.trim().length > 0 ? template : DEFAULT_TEMPLATE;

  return source.replace(PLACEHOLDER_PATTERN, (_, key: keyof ReleaseTemplateVariables) => {
    return variables[key] || "";
  });
}

export function formatReleaseAnnouncement(
  payload: GitHubReleaseEventPayload,
  template?: string
): FormattedAnnouncement {
  const variables = makeVariables(payload);
  const plainText = renderTemplate(template, variables);
  const cleanText = stripMarkdown(plainText);

  return {
    plainText,
    slackText: plainText,
    discordText: plainText,
    tweetText: truncate(cleanText, 280),
    emailSubject: `${variables.repo} release ${variables.tag}`,
    emailText: plainText,
    emailHtml: `<div style="font-family: ui-sans-serif, system-ui; line-height: 1.6; color: #111827;">
  <p>${escapeHtml(plainText).replace(/\n/g, "<br/>")}</p>
</div>`
  };
}

export const sampleReleasePayload: GitHubReleaseEventPayload = {
  action: "published",
  repository: {
    full_name: "openclaw/github-release-announcer",
    html_url: "https://github.com/openclaw/github-release-announcer",
    name: "github-release-announcer",
    owner: {
      login: "openclaw"
    }
  },
  release: {
    id: 1,
    tag_name: "v2.4.0",
    name: "v2.4.0 - Unified Channel Templates",
    body: "- Added per-channel templates with placeholder validation\n- Improved Slack and Discord markdown formatting\n- Added retry-safe delivery logging",
    html_url: "https://github.com/openclaw/github-release-announcer/releases/tag/v2.4.0",
    prerelease: false,
    draft: false,
    target_commitish: "main",
    published_at: new Date().toISOString(),
    author: {
      login: "release-bot"
    }
  },
  sender: {
    login: "release-bot"
  }
};
