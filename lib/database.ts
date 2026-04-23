import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ChannelConfigMap,
  ChannelName,
  DataStore,
  DeliveryLog,
  StripeCheckoutRecord
} from "@/lib/types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

const defaultChannelConfigs: ChannelConfigMap = {
  slack: {
    enabled: false,
    template:
      "🚀 {repo} shipped {tag}!\n\n{name}\n\n{notes}\n\nRead full release notes: {url}",
    updatedAt: "",
    botToken: "",
    channelId: ""
  },
  discord: {
    enabled: false,
    template:
      "🚀 **{repo}** shipped **{tag}**\n\n{name}\n\n{notes}\n\nRelease notes: {url}",
    updatedAt: "",
    webhookUrl: ""
  },
  twitter: {
    enabled: false,
    template: "{repo} {tag} is out now. {name}. Details: {url}",
    updatedAt: "",
    appKey: "",
    appSecret: "",
    accessToken: "",
    accessSecret: ""
  },
  email: {
    enabled: false,
    template:
      "{repo} has a new release: {tag}\n\n{name}\n\n{notes}\n\nRelease notes: {url}",
    updatedAt: "",
    smtpHost: "",
    smtpPort: "587",
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    fromEmail: "",
    recipients: ""
  }
};

function createDefaultStore(): DataStore {
  return {
    channelConfigs: {
      slack: { ...defaultChannelConfigs.slack },
      discord: { ...defaultChannelConfigs.discord },
      twitter: { ...defaultChannelConfigs.twitter },
      email: { ...defaultChannelConfigs.email }
    },
    stripeCheckoutSessions: {},
    deliveryLogs: []
  };
}

async function ensureStoreFile(): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await access(STORE_PATH);
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(createDefaultStore(), null, 2), "utf8");
  }
}

async function readStore(): Promise<DataStore> {
  await ensureStoreFile();
  const raw = await readFile(STORE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<DataStore>;

  return {
    channelConfigs: {
      slack: { ...defaultChannelConfigs.slack, ...(parsed.channelConfigs?.slack ?? {}) },
      discord: { ...defaultChannelConfigs.discord, ...(parsed.channelConfigs?.discord ?? {}) },
      twitter: { ...defaultChannelConfigs.twitter, ...(parsed.channelConfigs?.twitter ?? {}) },
      email: { ...defaultChannelConfigs.email, ...(parsed.channelConfigs?.email ?? {}) }
    },
    stripeCheckoutSessions: parsed.stripeCheckoutSessions ?? {},
    deliveryLogs: parsed.deliveryLogs ?? []
  };
}

async function writeStore(store: DataStore): Promise<void> {
  const tempPath = `${STORE_PATH}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, STORE_PATH);
}

let mutationQueue: Promise<unknown> = Promise.resolve();

function enqueueMutation<T>(operation: () => Promise<T>): Promise<T> {
  const run = mutationQueue.then(operation, operation);
  mutationQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function getChannelConfigs(): Promise<ChannelConfigMap> {
  const store = await readStore();
  return store.channelConfigs;
}

export async function saveChannelConfig<K extends ChannelName>(
  channel: K,
  values: Partial<ChannelConfigMap[K]>
): Promise<ChannelConfigMap[K]> {
  return enqueueMutation(async () => {
    const store = await readStore();
    const updated = {
      ...store.channelConfigs[channel],
      ...values,
      updatedAt: new Date().toISOString()
    } as ChannelConfigMap[K];

    store.channelConfigs[channel] = updated;
    await writeStore(store);
    return updated;
  });
}

export async function getRecentDeliveryLogs(limit = 20): Promise<DeliveryLog[]> {
  const store = await readStore();
  return store.deliveryLogs.slice(0, limit);
}

export async function recordDeliveryLog(
  input: Omit<DeliveryLog, "id" | "createdAt">
): Promise<DeliveryLog> {
  return enqueueMutation(async () => {
    const store = await readStore();
    const entry: DeliveryLog = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input
    };

    store.deliveryLogs.unshift(entry);
    store.deliveryLogs = store.deliveryLogs.slice(0, 200);
    await writeStore(store);
    return entry;
  });
}

export async function registerStripeCheckoutSession(
  sessionId: string,
  email: string | null
): Promise<StripeCheckoutRecord> {
  return enqueueMutation(async () => {
    const store = await readStore();
    const existing = store.stripeCheckoutSessions[sessionId];

    if (existing) {
      if (email && !existing.email) {
        existing.email = email;
        await writeStore(store);
      }
      return existing;
    }

    const record: StripeCheckoutRecord = {
      sessionId,
      email,
      createdAt: new Date().toISOString(),
      claimedAt: null
    };
    store.stripeCheckoutSessions[sessionId] = record;
    await writeStore(store);
    return record;
  });
}

export async function claimStripeCheckoutSession(
  sessionId: string
): Promise<StripeCheckoutRecord | null> {
  return enqueueMutation(async () => {
    const store = await readStore();
    const record = store.stripeCheckoutSessions[sessionId];

    if (!record || record.claimedAt) {
      return null;
    }

    record.claimedAt = new Date().toISOString();
    store.stripeCheckoutSessions[sessionId] = record;
    await writeStore(store);
    return record;
  });
}

export async function getDashboardSnapshot(): Promise<{
  activeChannels: number;
  totalDeliveries: number;
  lastDeliveryAt: string | null;
}> {
  const store = await readStore();
  const activeChannels = Object.values(store.channelConfigs).filter((entry) => entry.enabled).length;

  return {
    activeChannels,
    totalDeliveries: store.deliveryLogs.length,
    lastDeliveryAt: store.deliveryLogs[0]?.createdAt ?? null
  };
}
