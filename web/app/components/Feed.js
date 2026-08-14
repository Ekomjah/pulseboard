"use client";

import { useEffect, useMemo, useState } from "react";
import { listUpdates } from "@/lib/api";
import UpdateCard from "./UpdateCard";

const STATUS_OPTIONS = ["on-track", "blocked", "done"];

const STATUS_LABELS = {
  "on-track": "On track",
  blocked: "Blocked",
  done: "Done",
};

export default function Feed({ auth, refreshToken }) {
  const [updates, setUpdates] = useState([]);
  const [allUpdates, setAllUpdates] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMyUpdates, setShowMyUpdates] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listUpdates({
      status: statusFilter || undefined,
      author: authorFilter || undefined,
      tag: tagFilter || undefined,
      sort: sortOrder,
    })
      .then(({ updates: fetched }) => {
        if (!cancelled) setUpdates(fetched);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, authorFilter, tagFilter, sortOrder, refreshToken]);

  useEffect(() => {
    let cancelled = false;

    listUpdates()
      .then(({ updates: fetched }) => {
        if (!cancelled) setAllUpdates(fetched);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  const authors = useMemo(() => {
    const map = new Map();

    for (const u of allUpdates) {
      if (u.author?._id) {
        map.set(u.author._id, u.author.displayName);
      }
    }
    return Array.from(map.entries());
  }, [allUpdates]);

  const tags = useMemo(() => {
    const tagsArray = [];
    for (const u of updates) {
      tagsArray.push(...(u.tags ?? []));
    }
    return [...new Set(tagsArray)];
  }, [updates]);

  function handleUpdated(updated) {
    setUpdates((prev) =>
      prev.map((u) => (u._id === updated._id ? updated : u)),
    );
  }

  function handleDeleted(deleteId) {
    setUpdates((prev) => prev.filter((update) => update._id !== deleteId));
  }

  function handleShowMyUpdates() {
    try {
      setShowMyUpdates(!showMyUpdates);
      if (!showMyUpdates) {
        setAuthorFilter(auth ? auth.user._id : "");
      } else {
        setAuthorFilter("");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="feed">
      <div className="filter-bar">
        <div className="filter-row">
          <div
            className="segmented"
            role="group"
            aria-label="Filter by status"
          >
            {["", ...STATUS_OPTIONS].map((value) => (
              <button
                key={value || "all"}
                type="button"
                className={`seg-btn ${statusFilter === value ? "active" : ""}`}
                aria-pressed={statusFilter === value}
                onClick={() => setStatusFilter(value)}
              >
                {value ? STATUS_LABELS[value] : "All"}
              </button>
            ))}
          </div>
          {auth && (
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showMyUpdates}
                onChange={handleShowMyUpdates}
              />
              <span>Show My Updates</span>
            </label>
          )}
        </div>

        <div className="filter-row">
          <select
            aria-label="Filter by author"
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
          >
            <option value="">All authors</option>
            {authors.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by tag"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">All tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort updates"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="most-reactions">Most reactions</option>
          </select>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="hint">Loading feed...</p>}
      {!loading && updates.length === 0 && (
        <p className="hint">No updates yet.</p>
      )}

      <div className="update-list">
        {updates.map((update) => (
          <UpdateCard
            key={update._id}
            update={update}
            auth={auth}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
    </div>
  );
}
