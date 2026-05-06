import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "mutate_messenger_v1";
const MESSAGES_STORE = "messages";
const GROUP_KEYS_STORE = "groupKeys";
const GROUP_MESSAGES_STORE = "groupMessages";
const VERSION = 5;
const MIN_TIMESTAMP = -Number.MAX_SAFE_INTEGER;
const MAX_TIMESTAMP = Number.MAX_SAFE_INTEGER;


const CACHE_TTL_MS = 60_000;

export interface LocalMessage {
  _id: string;
  
  chatId: string;
  ownerHash: string;
  senderEmailHash: string;
  recipientEmailHash: string;
  message: string;
  timestamp: number;
}

export interface LocalGroupKey {
  key: string;
  ownerHash: string;
  groupId: string;
  keyId: number;
  groupKey: string;
  createdAt: number;
}

export type SystemEventKind =
  | "group_created"
  | "member_joined"
  | "member_added"
  | "member_left"
  | "member_removed"
  | "group_updated"
  | "admin_promoted"
  | "admin_demoted";

export interface SystemPayload {
  kind: SystemEventKind;
  targetEmailHash?: string;
  actorEmailHash?: string;
  changes?: Record<string, unknown>;
}

export interface LocalGroupMessage {
  _id: string;
  ownerHash: string;
  groupId: string;
  senderEmailHash: string;
  message: string;
  timestamp: number;
  messageType?: "text" | "file" | "system";
  systemPayload?: SystemPayload;
}

export interface HistoryOptions {
  


  limit?: number;
  
  before?: number;
}

interface MessageCacheEntry {
  messages: LocalMessage[];
  expires: number;
}

interface GroupMessageCacheEntry {
  messages: LocalGroupMessage[];
  expires: number;
}

interface GroupKeyCacheEntry {
  entry: LocalGroupKey;
  expires: number;
}

class StorageUtil {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private activeDB: IDBPDatabase | null = null;

  
  
  
  private readonly messageCache = new Map<string, MessageCacheEntry>();
  private readonly groupMessageCache = new Map<string, GroupMessageCacheEntry>();
  
  
  private readonly groupKeyCache = new Map<string, GroupKeyCacheEntry>();
  private static readonly GROUP_KEY_CACHE_TTL = 3_600_000; 

  private invalidateMessageCache(ownerHash: string, chatId: string) {
    this.messageCache.delete(`${ownerHash}:${chatId}`);
  }

  private invalidateGroupMessageCache(ownerHash: string, groupId: string) {
    this.groupMessageCache.delete(`${ownerHash}:${groupId}`);
  }

  

  private getDB(): Promise<IDBPDatabase> {
    if (typeof window === "undefined") {
      return new Promise(() => {});
    }
    if (!this.dbPromise) {
      const self = this;
      this.dbPromise = openDB(DB_NAME, VERSION, {
        upgrade(db, _oldVersion, _newVersion, tx) {
          const ensureIndex = (store: any, name: string, keyPath: string | string[]) => {
            if (!store.indexNames.contains(name)) store.createIndex(name, keyPath);
          };

          const messageStore = db.objectStoreNames.contains(MESSAGES_STORE)
            ? tx.objectStore(MESSAGES_STORE)
            : db.createObjectStore(MESSAGES_STORE, { keyPath: "_id" });
          ensureIndex(messageStore, "ownerHash", "ownerHash");
          ensureIndex(messageStore, "chatId", "chatId");
          ensureIndex(messageStore, "timestamp", "timestamp");
          ensureIndex(messageStore, "owner_chat", ["ownerHash", "chatId"]);
          ensureIndex(messageStore, "owner_chat_timestamp", ["ownerHash", "chatId", "timestamp"]);

          const groupKeyStore = db.objectStoreNames.contains(GROUP_KEYS_STORE)
            ? tx.objectStore(GROUP_KEYS_STORE)
            : db.createObjectStore(GROUP_KEYS_STORE, { keyPath: "key" });
          ensureIndex(groupKeyStore, "ownerHash", "ownerHash");
          ensureIndex(groupKeyStore, "groupId", "groupId");
          ensureIndex(groupKeyStore, "owner_group", ["ownerHash", "groupId"]);

          const groupMessageStore = db.objectStoreNames.contains(GROUP_MESSAGES_STORE)
            ? tx.objectStore(GROUP_MESSAGES_STORE)
            : db.createObjectStore(GROUP_MESSAGES_STORE, { keyPath: "_id" });
          ensureIndex(groupMessageStore, "ownerHash", "ownerHash");
          ensureIndex(groupMessageStore, "groupId", "groupId");
          ensureIndex(groupMessageStore, "owner_group", ["ownerHash", "groupId"]);
          ensureIndex(groupMessageStore, "timestamp", "timestamp");
          ensureIndex(groupMessageStore, "owner_group_timestamp", ["ownerHash", "groupId", "timestamp"]);
        },

        
        blocked() {
          window.location.reload();
        },

        
        
        blocking() {
          self.activeDB?.close();
          self.activeDB = null;
          self.dbPromise = null;
        },

        
        terminated() {
          self.activeDB = null;
          self.dbPromise = null;
        },
      }).then((db) => {
        self.activeDB = db;
        return db;
      }).catch((err) => {
        
        self.activeDB = null;
        self.dbPromise = null;
        throw err;
      });
    }
    return this.dbPromise;
  }

  

  private async readNewestByCompoundIndex<T>(
    storeName: string,
    indexName: string,
    ownerHash: string,
    targetId: string,
    options?: HistoryOptions,
  ): Promise<T[]> {
    const db = await this.getDB();
    const limit = Math.max(1, Math.floor(options?.limit || 50));
    const upperTimestamp = options?.before === undefined ? MAX_TIMESTAMP : options.before;
    const range = IDBKeyRange.bound(
      [ownerHash, targetId, MIN_TIMESTAMP],
      [ownerHash, targetId, upperTimestamp],
      false,
      options?.before !== undefined,
    );
    const tx = db.transaction(storeName, "readonly");
    const index = tx.store.index(indexName);
    const rows: T[] = [];
    let cursor = await index.openCursor(range, "prev");
    while (cursor && rows.length < limit) {
      rows.push(cursor.value as T);
      cursor = await cursor.continue();
    }
    await tx.done;
    return rows.reverse();
  }

  async saveMessage(message: LocalMessage) {
    
    this.invalidateMessageCache(message.ownerHash, message.chatId);
    const db = await this.getDB();
    await db.put(MESSAGES_STORE, message);
  }

  async getMessage(messageId: string): Promise<LocalMessage | undefined> {
    const db = await this.getDB();
    return db.get(MESSAGES_STORE, messageId);
  }

  









  async getChatHistory(
    ownerHash: string,
    otherHash: string,
    options?: HistoryOptions,
  ): Promise<LocalMessage[]> {
    if (options?.limit !== undefined) {
      return this.readNewestByCompoundIndex<LocalMessage>(
        MESSAGES_STORE,
        "owner_chat_timestamp",
        ownerHash,
        otherHash,
        options,
      );
    }

    const cacheKey = `${ownerHash}:${otherHash}`;
    const now = Date.now();

    let allMessages: LocalMessage[];
    const cached = this.messageCache.get(cacheKey);

    if (cached && cached.expires > now) {
      allMessages = cached.messages;
    } else {
      const db = await this.getDB();
      const raw = await db.getAllFromIndex(MESSAGES_STORE, "owner_chat", [ownerHash, otherHash]);
      allMessages = raw.sort((a, b) => a.timestamp - b.timestamp);
      this.messageCache.set(cacheKey, { messages: allMessages, expires: now + CACHE_TTL_MS });
    }

    if (!options) return allMessages;

    let result = allMessages;
    if (options.before !== undefined) {
      result = result.filter((m) => m.timestamp < options.before!);
    }
    if (options.limit !== undefined) {
      
      result = result.slice(-options.limit);
    }
    return result;
  }

  async getAllMessagesForOwner(ownerHash: string): Promise<LocalMessage[]> {
    const db = await this.getDB();
    return db.getAllFromIndex(MESSAGES_STORE, "ownerHash", ownerHash);
  }

  async deleteMessage(messageId: string) {
    const db = await this.getDB();
    await db.delete(MESSAGES_STORE, messageId);
  }

  async clearChat(ownerHash: string, otherHash: string) {
    this.invalidateMessageCache(ownerHash, otherHash);
    const db = await this.getDB();
    const messages = await this.getChatHistory(ownerHash, otherHash);
    const tx = db.transaction(MESSAGES_STORE, "readwrite");
    for (const msg of messages) await tx.store.delete(msg._id);
    await tx.done;
    
    this.invalidateMessageCache(ownerHash, otherHash);
  }

  async clearChatBefore(ownerHash: string, otherHash: string, cutoffTimestamp: number) {
    this.invalidateMessageCache(ownerHash, otherHash);
    const db = await this.getDB();
    const messages = await this.getChatHistory(ownerHash, otherHash);
    const tx = db.transaction(MESSAGES_STORE, "readwrite");
    for (const msg of messages) {
      if (msg.timestamp <= cutoffTimestamp) await tx.store.delete(msg._id);
    }
    await tx.done;
    this.invalidateMessageCache(ownerHash, otherHash);
  }

  

  async saveGroupKey(entry: LocalGroupKey) {
    
    const cacheKey = `${entry.ownerHash}:${entry.groupId}:${entry.keyId}`;
    this.groupKeyCache.set(cacheKey, {
      entry,
      expires: Date.now() + StorageUtil.GROUP_KEY_CACHE_TTL,
    });
    const db = await this.getDB();
    await db.put(GROUP_KEYS_STORE, entry);
  }

  async getGroupKey(ownerHash: string, groupId: string, keyId: number): Promise<LocalGroupKey | undefined> {
    const cacheKey = `${ownerHash}:${groupId}:${keyId}`;
    const now = Date.now();
    const cached = this.groupKeyCache.get(cacheKey);
    if (cached && cached.expires > now) return cached.entry;

    const db = await this.getDB();
    const entry = await db.get(GROUP_KEYS_STORE, cacheKey) as LocalGroupKey | undefined;
    if (entry) {
      this.groupKeyCache.set(cacheKey, { entry, expires: now + StorageUtil.GROUP_KEY_CACHE_TTL });
    }
    return entry;
  }

  async getLatestGroupKey(ownerHash: string, groupId: string): Promise<LocalGroupKey | undefined> {
    const db = await this.getDB();
    const all = (await db.getAllFromIndex(GROUP_KEYS_STORE, "owner_group", [ownerHash, groupId])) as LocalGroupKey[];
    if (!all.length) return undefined;
    return all.reduce((a, b) => (a.keyId > b.keyId ? a : b));
  }

  async deleteGroupKeys(ownerHash: string, groupId: string) {
    
    for (const k of this.groupKeyCache.keys()) {
      if (k.startsWith(`${ownerHash}:${groupId}:`)) this.groupKeyCache.delete(k);
    }
    const db = await this.getDB();
    const all = (await db.getAllFromIndex(GROUP_KEYS_STORE, "owner_group", [ownerHash, groupId])) as LocalGroupKey[];
    const tx = db.transaction(GROUP_KEYS_STORE, "readwrite");
    for (const k of all) await tx.store.delete(k.key);
    await tx.done;
  }

  

  async saveGroupMessage(msg: LocalGroupMessage) {
    this.invalidateGroupMessageCache(msg.ownerHash, msg.groupId);
    const db = await this.getDB();
    await db.put(GROUP_MESSAGES_STORE, msg);
  }

  async getGroupMessage(id: string): Promise<LocalGroupMessage | undefined> {
    const db = await this.getDB();
    return db.get(GROUP_MESSAGES_STORE, id);
  }

  






  async getGroupHistory(
    ownerHash: string,
    groupId: string,
    options?: HistoryOptions,
  ): Promise<LocalGroupMessage[]> {
    if (options?.limit !== undefined) {
      return this.readNewestByCompoundIndex<LocalGroupMessage>(
        GROUP_MESSAGES_STORE,
        "owner_group_timestamp",
        ownerHash,
        groupId,
        options,
      );
    }

    const cacheKey = `${ownerHash}:${groupId}`;
    const now = Date.now();

    let allMessages: LocalGroupMessage[];
    const cached = this.groupMessageCache.get(cacheKey);

    if (cached && cached.expires > now) {
      allMessages = cached.messages;
    } else {
      const db = await this.getDB();
      const raw = (await db.getAllFromIndex(GROUP_MESSAGES_STORE, "owner_group", [ownerHash, groupId])) as LocalGroupMessage[];
      allMessages = raw.sort((a, b) => a.timestamp - b.timestamp);
      this.groupMessageCache.set(cacheKey, { messages: allMessages, expires: now + CACHE_TTL_MS });
    }

    if (!options) return allMessages;

    let result = allMessages;
    if (options.before !== undefined) {
      result = result.filter((m) => m.timestamp < options.before!);
    }
    if (options.limit !== undefined) {
      result = result.slice(-options.limit);
    }
    return result;
  }

  async clearGroup(ownerHash: string, groupId: string) {
    this.invalidateGroupMessageCache(ownerHash, groupId);
    const db = await this.getDB();
    const history = await this.getGroupHistory(ownerHash, groupId);
    const tx = db.transaction(GROUP_MESSAGES_STORE, "readwrite");
    for (const m of history) await tx.store.delete(m._id);
    await tx.done;
    this.invalidateGroupMessageCache(ownerHash, groupId);
  }

  

  async exportAll() {
    const db = await this.getDB();
    const [messages, groupKeys, groupMessages] = await Promise.all([
      db.getAll(MESSAGES_STORE),
      db.getAll(GROUP_KEYS_STORE),
      db.getAll(GROUP_MESSAGES_STORE),
    ]);
    return { messages, groupKeys, groupMessages };
  }

  async importAll(data: {
    messages?: LocalMessage[];
    groupKeys?: LocalGroupKey[];
    groupMessages?: LocalGroupMessage[];
  }) {
    
    this.messageCache.clear();
    this.groupMessageCache.clear();

    const db = await this.getDB();
    const tx = db.transaction([MESSAGES_STORE, GROUP_KEYS_STORE, GROUP_MESSAGES_STORE], "readwrite");
    for (const msg of data.messages || []) await tx.objectStore(MESSAGES_STORE).put(msg);
    for (const key of data.groupKeys || []) await tx.objectStore(GROUP_KEYS_STORE).put(key);
    for (const msg of data.groupMessages || []) await tx.objectStore(GROUP_MESSAGES_STORE).put(msg);
    await tx.done;
  }
}

export const storageUtil = new StorageUtil();
