-- Kabile Bot — Full Schema Migration
-- Tüm tablolar oluşturulmakta, varsa atlanır.

CREATE TABLE IF NOT EXISTS guilds (
  id                    VARCHAR(20)   PRIMARY KEY,
  name                  VARCHAR(100)  NOT NULL,

  guard_enabled         BOOLEAN       DEFAULT true,
  anti_raid_limit       INTEGER       DEFAULT 5,
  anti_nuke_enabled     BOOLEAN       DEFAULT true,
  whitelist_roles       TEXT[]        DEFAULT '{}',

  register_channel      VARCHAR(20),
  register_role         VARCHAR(20),
  register_enabled      BOOLEAN       DEFAULT false,

  join_role_id          VARCHAR(20),

  log_channel           VARCHAR(20),
  mod_log_channel       VARCHAR(20),
  join_log_channel      VARCHAR(20),
  message_log_channel   VARCHAR(20),
  voice_log_channel     VARCHAR(20),
  message_log_enabled   BOOLEAN       DEFAULT false,
  member_log_enabled    BOOLEAN       DEFAULT true,
  voice_log_enabled     BOOLEAN       DEFAULT false,

  report_channel        VARCHAR(20),
  suggestion_channel    VARCHAR(20),

  invite_tracking       BOOLEAN       DEFAULT false,
  invite_roles          JSONB         DEFAULT '[]',

  auto_mod_enabled      BOOLEAN       DEFAULT true,
  filter_swear          BOOLEAN       DEFAULT true,
  filter_spam           BOOLEAN       DEFAULT true,
  filter_caps           BOOLEAN       DEFAULT true,
  filter_links          BOOLEAN       DEFAULT false,
  filter_mentions       BOOLEAN       DEFAULT true,
  max_warns             INTEGER       DEFAULT 5,
  auto_mute_duration    INTEGER       DEFAULT 60,

  created_at            TIMESTAMP     DEFAULT NOW(),
  updated_at            TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id              VARCHAR(20)   NOT NULL,
  guild_id        VARCHAR(20)   NOT NULL,
  username        VARCHAR(32),
  display_name    VARCHAR(32),

  registered      BOOLEAN       DEFAULT false,
  registered_at   TIMESTAMP,
  registerer_id   VARCHAR(20),

  total_invites   INTEGER       DEFAULT 0,
  join_inviter    VARCHAR(20),
  fake_invites    INTEGER       DEFAULT 0,
  left_invites    INTEGER       DEFAULT 0,
  bonus_invites   INTEGER       DEFAULT 0,

  last_message_at TIMESTAMP,
  join_at         TIMESTAMP     DEFAULT NOW(),
  warn_count      INTEGER       DEFAULT 0,

  PRIMARY KEY (id, guild_id)
);

CREATE TABLE IF NOT EXISTS infractions (
  id            SERIAL        PRIMARY KEY,
  guild_id      VARCHAR(20)   NOT NULL,
  user_id       VARCHAR(20)   NOT NULL,
  moderator_id  VARCHAR(20)   NOT NULL,
  type          VARCHAR(20)   NOT NULL,
  reason        TEXT,
  duration      INTEGER,
  active        BOOLEAN       DEFAULT true,
  created_at    TIMESTAMP     DEFAULT NOW(),
  expires_at    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id            SERIAL        PRIMARY KEY,
  guild_id      VARCHAR(20)   NOT NULL,
  reporter_id   VARCHAR(20)   NOT NULL,
  target_id     VARCHAR(20)   NOT NULL,
  reason        TEXT          NOT NULL,
  channel_id    VARCHAR(20),
  message_id    VARCHAR(20),
  evidence_url  VARCHAR(500),

  status        VARCHAR(20)   DEFAULT 'beklemede',
  assigned_mod  VARCHAR(20),
  resolution    TEXT,
  resolved_at   TIMESTAMP,

  created_at    TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suggestions (
  id            SERIAL        PRIMARY KEY,
  guild_id      VARCHAR(20)   NOT NULL,
  author_id     VARCHAR(20)   NOT NULL,
  title         VARCHAR(100)  NOT NULL,
  description   TEXT          NOT NULL,
  category      VARCHAR(50),

  status        VARCHAR(20)   DEFAULT 'beklemede',
  upvotes       INTEGER       DEFAULT 0,
  downvotes     INTEGER       DEFAULT 0,

  message_id    VARCHAR(20),
  channel_id    VARCHAR(20),

  admin_response  TEXT,
  responded_by    VARCHAR(20),
  responded_at    TIMESTAMP,

  created_at    TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  id            SERIAL        PRIMARY KEY,
  guild_id      VARCHAR(20)   NOT NULL,
  type          VARCHAR(30)   NOT NULL,
  target_id     VARCHAR(20),
  moderator_id  VARCHAR(20),
  reason        TEXT,
  changes       JSONB,
  old_data      JSONB,
  new_data      JSONB,
  created_at    TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_roles (
  id            SERIAL        PRIMARY KEY,
  guild_id      VARCHAR(20)   NOT NULL,
  role_id       VARCHAR(20)   NOT NULL,
  type          VARCHAR(20)   DEFAULT 'join',
  created_at    TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invites (
  code          VARCHAR(20)   PRIMARY KEY,
  guild_id      VARCHAR(20)   NOT NULL,
  inviter_id    VARCHAR(20),
  uses          INTEGER       DEFAULT 0,
  max_uses      INTEGER,
  created_at    TIMESTAMP     DEFAULT NOW(),
  expires_at    TIMESTAMP
);

-- Performans için index'ler
CREATE INDEX IF NOT EXISTS idx_members_guild     ON members(guild_id);
CREATE INDEX IF NOT EXISTS idx_infractions_user  ON infractions(user_id, guild_id);
CREATE INDEX IF NOT EXISTS idx_infractions_guild ON infractions(guild_id);
CREATE INDEX IF NOT EXISTS idx_logs_guild        ON logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_logs_type         ON logs(type);
CREATE INDEX IF NOT EXISTS idx_reports_guild     ON reports(guild_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_guild ON suggestions(guild_id);
CREATE INDEX IF NOT EXISTS idx_invites_guild     ON invites(guild_id);

-- Tamamlandı
SELECT 'Migration başarıyla uygulandı ✅' AS status;
