import { useState, useEffect, useRef } from "react";

const TEMPOS = ["Downtempo", "Midtempo", "Uptempo"];
const STATUSES = ["Top", "Ready", "Ok", "Needs Work", "Idea"];

const TEMPO_COLORS = {
  Downtempo: "#6b8aed",
  Midtempo: "#e8a838",
  Uptempo: "#e85d75",
};

const STATUS_COLORS = {
  Top: "#4ade80",
  Ready: "#60d0f0",
  Ok: "#a0a0b8",
  "Needs Work": "#f0a050",
  Idea: "#c084fc",
};

const uid = () => Math.random().toString(36).slice(2, 10);

function App() {
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [activeView, setActiveView] = useState("library");
  const [activeSetlistId, setActiveSetlistId] = useState(null);
  const [newSongName, setNewSongName] = useState("");
  const [newSongTempo, setNewSongTempo] = useState("Midtempo");
  const [newSongStatus, setNewSongStatus] = useState("Idea");
  const [newSetlistName, setNewSetlistName] = useState("");
  const [showAddSong, setShowAddSong] = useState(false);
  const [showAddSetlist, setShowAddSetlist] = useState(false);
  const [showAddToSetlist, setShowAddToSetlist] = useState(false);
  const [addToSearch, setAddToSearch] = useState("");
  const [addToFilterTempo, setAddToFilterTempo] = useState("All");
  const [addToFilterStatus, setAddToFilterStatus] = useState("All");
  const [editingSongId, setEditingSongId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [librarySearch, setLibrarySearch] = useState("");
  const [filterTempo, setFilterTempo] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [editingSetlistId, setEditingSetlistId] = useState(null);
  const [editingSetlistName, setEditingSetlistName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [importPending, setImportPending] = useState(null);

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const importInputRef = useRef(null);

  // Load data
  useEffect(() => {
    try {
      const saved = localStorage.getItem("setlist-app-data");
      if (saved) {
        const data = JSON.parse(saved);
        setSongs(data.songs || []);
        setSetlists(data.setlists || []);
      }
    } catch (e) {
      console.log("No saved data found");
    }
    setLoaded(true);
  }, []);

  // Save data
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(
        "setlist-app-data",
        JSON.stringify({ songs, setlists })
      );
    }
  }, [songs, setlists, loaded]);

  // Song CRUD
  const addSong = () => {
    if (!newSongName.trim()) return;
    setSongs((prev) => [
      ...prev,
      { id: uid(), name: newSongName.trim(), tempo: newSongTempo, status: newSongStatus },
    ]);
    setNewSongName("");
    setNewSongTempo("Midtempo");
    setNewSongStatus("Idea");
    setShowAddSong(false);
  };

  const deleteSong = (id) => {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    setSetlists((prev) =>
      prev.map((sl) => ({
        ...sl,
        songIds: sl.songIds.filter((sid) => sid !== id),
      }))
    );
  };

  const startEdit = (song) => {
    setEditingSongId(song.id);
    setEditValues({ name: song.name, tempo: song.tempo, status: song.status });
  };

  const saveEdit = () => {
    setSongs((prev) =>
      prev.map((s) =>
        s.id === editingSongId
          ? { ...s, name: editValues.name, tempo: editValues.tempo, status: editValues.status }
          : s
      )
    );
    setEditingSongId(null);
  };

  // Setlist CRUD
  const addSetlist = () => {
    if (!newSetlistName.trim()) return;
    const sl = { id: uid(), name: newSetlistName.trim(), songIds: [], date: new Date().toISOString().slice(0, 10) };
    setSetlists((prev) => [...prev, sl]);
    setNewSetlistName("");
    setShowAddSetlist(false);
    setActiveSetlistId(sl.id);
    setActiveView("setlist");
  };

  const deleteSetlist = (id) => {
    setSetlists((prev) => prev.filter((sl) => sl.id !== id));
    if (activeSetlistId === id) {
      setActiveView("library");
      setActiveSetlistId(null);
    }
  };

  const renameSetlist = (id) => {
    if (!editingSetlistName.trim()) return;
    setSetlists((prev) => prev.map((sl) => sl.id === id ? { ...sl, name: editingSetlistName.trim() } : sl));
    setEditingSetlistId(null);
    setEditingSetlistName("");
  };

  const addSongToSetlist = (songId) => {
    setSetlists((prev) =>
      prev.map((sl) =>
        sl.id === activeSetlistId && !sl.songIds.includes(songId)
          ? { ...sl, songIds: [...sl.songIds, songId] }
          : sl
      )
    );
  };

  const removeSongFromSetlist = (songId) => {
    setSetlists((prev) =>
      prev.map((sl) =>
        sl.id === activeSetlistId
          ? { ...sl, songIds: sl.songIds.filter((id) => id !== songId) }
          : sl
      )
    );
  };

  // Drag and drop for setlist reordering
  const handleDragStart = (idx) => {
    dragItem.current = idx;
    setDragIndex(idx);
  };

  const handleDragEnter = (idx) => {
    dragOverItem.current = idx;
    setOverIndex(idx);
  };

  const handleDragEnd = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from !== null && to !== null && from !== to) {
      setSetlists((prev) =>
        prev.map((sl) => {
          if (sl.id !== activeSetlistId) return sl;
          const newIds = [...sl.songIds];
          const [removed] = newIds.splice(from, 1);
          newIds.splice(to, 0, removed);
          return { ...sl, songIds: newIds };
        })
      );
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIndex(null);
    setOverIndex(null);
  };

  const exportData = () => {
    const data = JSON.stringify({ songs, setlists }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "setlist-manager.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.songs && !data.setlists) { alert("Invalid file."); return; }
        if (songs.length > 0 || setlists.length > 0) {
          setImportPending(data);
        } else {
          if (data.songs) setSongs(data.songs);
          if (data.setlists) setSetlists(data.setlists);
        }
      } catch {
        alert("Invalid file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const applyImport = (mode) => {
    if (!importPending) return;
    if (mode === "replace") {
      setSongs(importPending.songs || []);
      setSetlists(importPending.setlists || []);
    } else {
      const existingIds = new Set(songs.map((s) => s.id));
      const newSongs = (importPending.songs || []).filter((s) => !existingIds.has(s.id));
      const existingSlIds = new Set(setlists.map((sl) => sl.id));
      const newSetlists = (importPending.setlists || []).filter((sl) => !existingSlIds.has(sl.id));
      setSongs((prev) => [...prev, ...newSongs]);
      setSetlists((prev) => [...prev, ...newSetlists]);
    }
    setImportPending(null);
  };

  const printSetlist = () => {
    if (!activeSetlist) return;
    const songNames = activeSetlist.songIds
      .map((id) => songMap[id]?.name)
      .filter(Boolean);
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${activeSetlist.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      background: #fff;
      color: #000;
      padding: 48px 56px;
    }
    h1 {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 32px;
      letter-spacing: -0.02em;
    }
    ol {
      list-style: none;
      counter-reset: songs;
    }
    li {
      counter-increment: songs;
      display: flex;
      align-items: baseline;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
      font-size: 26px;
    }
    li::before {
      content: counter(songs);
      min-width: 32px;
      font-size: 15px;
      color: #999;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      text-align: right;
      flex-shrink: 0;
    }
    @media print {
      body { padding: 24px 32px; }
    }
  </style>
</head>
<body>
  <h1>${activeSetlist.name}</h1>
  <ol>
    ${songNames.map((name) => `<li>${name}</li>`).join("\n    ")}
  </ol>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  const activeSetlist = setlists.find((sl) => sl.id === activeSetlistId);
  const songMap = Object.fromEntries(songs.map((s) => [s.id, s]));

  // Filtered + sorted songs for library
  const filteredSongs = songs
    .filter((s) => s.name.toLowerCase().includes(librarySearch.toLowerCase()))
    .filter((s) => (filterTempo === "All" ? true : s.tempo === filterTempo))
    .filter((s) => (filterStatus === "All" ? true : s.status === filterStatus))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "tempo") return TEMPOS.indexOf(a.tempo) - TEMPOS.indexOf(b.tempo);
      if (sortBy === "status") return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      return 0;
    });

  // Songs available to add to current setlist
  const availableSongs = activeSetlist
    ? songs
        .filter((s) => !activeSetlist.songIds.includes(s.id))
        .filter((s) => s.name.toLowerCase().includes(addToSearch.toLowerCase()))
        .filter((s) => addToFilterTempo === "All" || s.tempo === addToFilterTempo)
        .filter((s) => addToFilterStatus === "All" || s.status === addToFilterStatus)
    : [];

  if (!loaded) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingText}>Loading your setlists...</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{globalCSS}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>♫</div>
          <h1 style={styles.title}>Setlists</h1>
        </div>
        <div className="data-btns">
          <input ref={importInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={importData} />
          <button style={styles.dataBtn} onClick={() => importInputRef.current.click()}>Load</button>
          <button style={styles.dataBtn} onClick={exportData}>Save</button>
        </div>
        <nav className="main-nav" style={styles.nav}>
          <button
            style={{
              ...styles.navBtn,
              ...(activeView === "library" ? styles.navBtnActive : {}),
            }}
            onClick={() => setActiveView("library")}
          >
            Library
          </button>
          <button
            style={{
              ...styles.navBtn,
              ...(activeView === "setlists" || activeView === "setlist"
                ? styles.navBtnActive
                : {}),
            }}
            onClick={() => setActiveView("setlists")}
          >
            Setlists
          </button>
        </nav>
      </header>

      <main style={styles.main}>
        {/* ── IMPORT CONFIRMATION ── */}
        {importPending && (
          <div style={styles.importBanner}>
            <span style={styles.importBannerText}>
              You already have data. Merge the file in, or replace everything?
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.importBannerBtn} onClick={() => applyImport("merge")}>Merge</button>
              <button style={{ ...styles.importBannerBtn, ...styles.importBannerBtnDanger }} onClick={() => applyImport("replace")}>Replace</button>
              <button style={styles.importBannerCancel} onClick={() => setImportPending(null)}>✕</button>
            </div>
          </div>
        )}

        {/* ── LIBRARY VIEW ── */}
        {activeView === "library" && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Song Library</h2>
                <p style={styles.sectionSub}>{songs.length} song{songs.length !== 1 ? "s" : ""}</p>
              </div>
              <button style={styles.addBtn} onClick={() => setShowAddSong(!showAddSong)}>
                {showAddSong ? "Cancel" : "+ Add Song"}
              </button>
            </div>

            {/* Add song form */}
            {showAddSong && (
              <div style={styles.addForm}>
                <input
                  style={styles.input}
                  placeholder="Song title..."
                  value={newSongName}
                  onChange={(e) => setNewSongName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSong()}
                  autoFocus
                />
                <div style={styles.addFormRow}>
                  <select style={styles.select} value={newSongTempo} onChange={(e) => setNewSongTempo(e.target.value)}>
                    {TEMPOS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <select style={styles.select} value={newSongStatus} onChange={(e) => setNewSongStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button style={styles.confirmBtn} onClick={addSong}>Add</button>
                </div>
              </div>
            )}

            {/* Search */}
            {songs.length > 0 && (
              <input
                style={styles.librarySearch}
                placeholder="Search songs..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
              />
            )}

            {/* Filters */}
            {songs.length > 0 && (
              <div style={styles.filters}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Tempo</label>
                  <select style={styles.filterSelect} value={filterTempo} onChange={(e) => setFilterTempo(e.target.value)}>
                    <option>All</option>
                    {TEMPOS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Status</label>
                  <select style={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option>All</option>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Sort</label>
                  <select style={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">Name</option>
                    <option value="tempo">Tempo</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
            )}

            {/* Song list */}
            <div style={styles.songList}>
              {filteredSongs.length === 0 && songs.length > 0 && (
                <div style={styles.empty}>No songs match your search.</div>
              )}
              {songs.length === 0 && (
                <div style={styles.empty}>Your library is empty. Add your first song above.</div>
              )}
              {filteredSongs.map((song) => (
                <div key={song.id} style={styles.songRow}>
                  {editingSongId === song.id ? (
                    <div style={styles.editRow}>
                      <input
                        style={styles.editInput}
                        value={editValues.name}
                        onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        autoFocus
                      />
                      <select style={styles.editSelect} value={editValues.tempo} onChange={(e) => setEditValues((v) => ({ ...v, tempo: e.target.value }))}>
                        {TEMPOS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <select style={styles.editSelect} value={editValues.status} onChange={(e) => setEditValues((v) => ({ ...v, status: e.target.value }))}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                      <button style={styles.smallBtn} onClick={saveEdit}>✓</button>
                      <button style={{ ...styles.smallBtn, ...styles.smallBtnDanger }} onClick={() => setEditingSongId(null)}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div className="song-main">
                        <div style={styles.songName}>{song.name}</div>
                        <div style={styles.songTags}>
                          <span style={{ ...styles.tag, background: TEMPO_COLORS[song.tempo] + "22", color: TEMPO_COLORS[song.tempo], border: `1px solid ${TEMPO_COLORS[song.tempo]}44` }}>
                            {song.tempo}
                          </span>
                          <span style={{ ...styles.tag, background: STATUS_COLORS[song.status] + "22", color: STATUS_COLORS[song.status], border: `1px solid ${STATUS_COLORS[song.status]}44` }}>
                            {song.status}
                          </span>
                        </div>
                      </div>
                      <div style={styles.songActions}>
                        <button className="action-btn" style={styles.iconBtn} onClick={() => startEdit(song)} title="Edit">✎</button>
                        <button className="action-btn" style={{ ...styles.iconBtn, ...styles.iconBtnDanger }} onClick={() => { if (window.confirm(`Delete "${song.name}"?`)) deleteSong(song.id); }} title="Delete">✕</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETLISTS INDEX ── */}
        {activeView === "setlists" && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Your Setlists</h2>
                <p style={styles.sectionSub}>{setlists.length} setlist{setlists.length !== 1 ? "s" : ""}</p>
              </div>
              <button style={styles.addBtn} onClick={() => setShowAddSetlist(!showAddSetlist)}>
                {showAddSetlist ? "Cancel" : "+ New Setlist"}
              </button>
            </div>

            {showAddSetlist && (
              <div style={styles.addForm}>
                <input
                  style={styles.input}
                  placeholder="Setlist name (e.g. Friday @ The Blue Note)"
                  value={newSetlistName}
                  onChange={(e) => setNewSetlistName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSetlist()}
                  autoFocus
                />
                <button style={styles.confirmBtn} onClick={addSetlist}>Create</button>
              </div>
            )}

            <div style={styles.setlistGrid}>
              {setlists.length === 0 && (
                <div style={styles.empty}>No setlists yet. Create one for your next gig.</div>
              )}
              {setlists.map((sl) => (
                <div
                  key={sl.id}
                  style={styles.setlistCard}
                  onClick={() => { if (editingSetlistId !== sl.id) { setActiveSetlistId(sl.id); setActiveView("setlist"); } }}
                >
                  {editingSetlistId === sl.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 80 }} onClick={(e) => e.stopPropagation()}>
                      <input
                        style={{ ...styles.editInput, flex: 1 }}
                        value={editingSetlistName}
                        onChange={(e) => setEditingSetlistName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") renameSetlist(sl.id); if (e.key === "Escape") { setEditingSetlistId(null); setEditingSetlistName(""); } }}
                        autoFocus
                      />
                      <button style={styles.smallBtn} onClick={() => renameSetlist(sl.id)}>✓</button>
                      <button style={{ ...styles.smallBtn, ...styles.smallBtnDanger }} onClick={() => { setEditingSetlistId(null); setEditingSetlistName(""); }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div style={styles.setlistCardName}>{sl.name}</div>
                      <div style={styles.setlistCardMeta}>
                        {sl.songIds.length} song{sl.songIds.length !== 1 ? "s" : ""} · {sl.date}
                      </div>
                    </>
                  )}
                  <div style={styles.setlistCardBtns} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={{ ...styles.iconBtn, ...styles.iconBtnEdit }}
                      onClick={(e) => { e.stopPropagation(); setEditingSetlistId(sl.id); setEditingSetlistName(sl.name); }}
                      title="Rename setlist"
                    >✎</button>
                    <button
                      style={{ ...styles.iconBtn, ...styles.iconBtnDanger }}
                      onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${sl.name}"?`)) deleteSetlist(sl.id); }}
                      title="Delete setlist"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SINGLE SETLIST VIEW ── */}
        {activeView === "setlist" && activeSetlist && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <button style={styles.backBtn} onClick={() => setActiveView("setlists")}>← Setlists</button>
                <h2 style={styles.sectionTitle}>{activeSetlist.name}</h2>
                <p style={styles.sectionSub}>
                  {activeSetlist.songIds.length} song{activeSetlist.songIds.length !== 1 ? "s" : ""}
                  {activeSetlist.songIds.length > 0 && " · drag to reorder"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {activeSetlist.songIds.length > 0 && (
                  <button style={styles.printBtn} onClick={printSetlist}>⎙ Print</button>
                )}
                <button style={styles.addBtn} onClick={() => {
                  if (showAddToSetlist) {
                    setAddToSearch("");
                    setAddToFilterTempo("All");
                    setAddToFilterStatus("All");
                  }
                  setShowAddToSetlist(!showAddToSetlist);
                }}>
                  {showAddToSetlist ? "Done" : "+ Add Songs"}
                </button>
              </div>
            </div>

            {/* Add songs to setlist panel */}
            {showAddToSetlist && (
              <div style={styles.addToSetlistPanel}>
                <div style={styles.addToControls}>
                  <input
                    style={styles.addToSearch}
                    placeholder="Search songs..."
                    value={addToSearch}
                    onChange={(e) => setAddToSearch(e.target.value)}
                    autoFocus
                  />
                  <select style={styles.filterSelect} value={addToFilterTempo} onChange={(e) => setAddToFilterTempo(e.target.value)}>
                    <option>All</option>
                    {TEMPOS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <select style={styles.filterSelect} value={addToFilterStatus} onChange={(e) => setAddToFilterStatus(e.target.value)}>
                    <option>All</option>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {availableSongs.length === 0 ? (
                  <div style={styles.emptySmall}>
                    {songs.length === 0
                      ? "Your library is empty. Add songs in the Library first."
                      : addToSearch || addToFilterTempo !== "All" || addToFilterStatus !== "All"
                      ? "No songs match your search."
                      : "All songs are already in this setlist."}
                  </div>
                ) : (
                  availableSongs.map((song) => (
                    <div key={song.id} style={styles.addToRow} onClick={() => addSongToSetlist(song.id)}>
                      <span style={styles.addToName}>{song.name}</span>
                      <span style={{ ...styles.miniTag, color: TEMPO_COLORS[song.tempo] }}>{song.tempo}</span>
                      <span style={{ ...styles.miniTag, color: STATUS_COLORS[song.status] }}>{song.status}</span>
                      <span style={styles.addIcon}>+</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Setlist songs with drag-and-drop */}
            <div style={styles.setlistSongs}>
              {activeSetlist.songIds.length === 0 && (
                <div style={styles.empty}>This setlist is empty. Click "+ Add Songs" to build it.</div>
              )}
              {activeSetlist.songIds.map((sid, idx) => {
                const song = songMap[sid];
                if (!song) return null;
                const isDragging = dragIndex === idx;
                const isOver = overIndex === idx;
                return (
                  <div
                    key={sid}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                      ...styles.setlistItem,
                      opacity: isDragging ? 0.4 : 1,
                      borderTop: isOver && dragIndex > idx ? "2px solid #e8a838" : undefined,
                      borderBottom: isOver && dragIndex < idx ? "2px solid #e8a838" : undefined,
                    }}
                  >
                    <div style={styles.dragHandle}>⠿</div>
                    <div style={styles.setlistNum}>{idx + 1}</div>
                    <div className="setlist-content">
                      <div style={styles.songName}>{song.name}</div>
                      <div style={styles.songTags}>
                        <span style={{ ...styles.tag, background: TEMPO_COLORS[song.tempo] + "22", color: TEMPO_COLORS[song.tempo], border: `1px solid ${TEMPO_COLORS[song.tempo]}44` }}>
                          {song.tempo}
                        </span>
                        <span style={{ ...styles.tag, background: STATUS_COLORS[song.status] + "22", color: STATUS_COLORS[song.status], border: `1px solid ${STATUS_COLORS[song.status]}44` }}>
                          {song.status}
                        </span>
                      </div>
                    </div>
                    <button className="action-btn" style={{ ...styles.iconBtn, ...styles.iconBtnDanger }} onClick={() => { if (window.confirm(`Remove "${song.name}" from this setlist?`)) removeSongFromSetlist(sid); }} title="Remove">✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        by <a href="https://calvinwest.com" target="_blank" rel="noreferrer" style={styles.footerLink}>calvinwest.com</a>
      </footer>
    </div>
  );
}

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0e0e14; }

  input:focus, select:focus { outline: none; border-color: #e8a838 !important; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }

  select option {
    background: #1a1a28;
    color: #e0e0ec;
  }

  .data-btns { display: flex; align-items: center; gap: 8px; }

  .song-main { flex: 1; display: flex; align-items: center; gap: 12px; min-width: 0; }

  .setlist-content { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }

  .action-btn:hover { background: #22222f !important; border-color: #404058 !important; }

  @media (max-width: 520px) {
    .data-btns { flex-direction: column; gap: 4px; }
    .main-nav { flex-direction: column; }
    .song-main { flex-direction: column; align-items: flex-start; gap: 5px; }
    .setlist-content { flex-direction: column; align-items: flex-start; gap: 4px; }
    .action-btn { width: 42px !important; height: 42px !important; border-radius: 10px !important; font-size: 17px !important; }
  }
`;

const styles = {
  app: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#0e0e14",
    color: "#e0e0ec",
    minHeight: "100vh",
    maxWidth: 800,
    margin: "0 auto",
    padding: "0 16px",
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#0e0e14",
    fontFamily: "'DM Sans', sans-serif",
  },
  loadingText: { color: "#707088", fontSize: 16 },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 0 16px",
    borderBottom: "1px solid #1e1e2e",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: {
    fontSize: 24,
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #e8a838, #e85d75)",
    borderRadius: 10,
    color: "#0e0e14",
    fontWeight: 700,
  },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" },
  nav: { display: "flex", gap: 4, background: "#16161f", borderRadius: 10, padding: 3 },
  navBtn: {
    padding: "8px 18px",
    border: "none",
    background: "transparent",
    color: "#707088",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  navBtnActive: {
    background: "#22222f",
    color: "#e0e0ec",
  },

  // Main
  main: { padding: "24px 0" },

  // Section
  section: {},
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 16,
  },
  sectionTitle: { fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" },
  sectionSub: { fontSize: 13, color: "#707088", marginTop: 4 },

  // Buttons
  addBtn: {
    padding: "10px 20px",
    border: "1px solid #2a2a3a",
    background: "#16161f",
    color: "#e0e0ec",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  },
  dataBtn: {
    padding: "6px 12px",
    border: "1px solid #2a2a3a",
    background: "transparent",
    color: "#505068",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
  },
  printBtn: {
    padding: "10px 20px",
    border: "1px solid #2a2a3a",
    background: "#16161f",
    color: "#707088",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  },
  confirmBtn: {
    padding: "10px 24px",
    border: "none",
    background: "linear-gradient(135deg, #e8a838, #e85d75)",
    color: "#0e0e14",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  },
  backBtn: {
    padding: 0,
    border: "none",
    background: "none",
    color: "#707088",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 4,
    display: "block",
  },

  // Forms
  addForm: {
    background: "#16161f",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  addFormRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  input: {
    flex: 1,
    padding: "10px 14px",
    border: "1px solid #2a2a3a",
    background: "#0e0e14",
    color: "#e0e0ec",
    borderRadius: 8,
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #2a2a3a",
    background: "#0e0e14",
    color: "#e0e0ec",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    appearance: "auto",
  },

  // Library search
  librarySearch: {
    width: "100%",
    padding: "8px 14px",
    border: "1px solid #2a2a3a",
    background: "#0e0e14",
    color: "#e0e0ec",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 12,
    boxSizing: "border-box",
  },

  // Filters
  filters: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterGroup: { display: "flex", alignItems: "center", gap: 6 },
  filterLabel: { fontSize: 12, color: "#707088", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" },
  filterSelect: {
    padding: "6px 10px",
    border: "1px solid #2a2a3a",
    background: "#16161f",
    color: "#e0e0ec",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    appearance: "auto",
  },

  // Song list
  songList: { display: "flex", flexDirection: "column", gap: 2 },
  songRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "#13131c",
    borderRadius: 10,
    transition: "background 0.1s",
  },
  songName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 500,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  songTags: { display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" },
  tag: {
    padding: "3px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
    whiteSpace: "nowrap",
  },
  songActions: { display: "flex", gap: 4, flexShrink: 0 },
  iconBtn: {
    width: 34,
    height: 34,
    border: "1px solid #2a2a3a",
    background: "#16161f",
    color: "#707088",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.1s",
    fontFamily: "sans-serif",
    flexShrink: 0,
  },
  iconBtnDanger: { color: "#ef4444", borderColor: "#3a1a1a" },
  iconBtnEdit: { color: "#707088", borderColor: "#2a2a3a" },

  // Edit row
  editRow: { display: "flex", gap: 8, alignItems: "center", width: "100%", flexWrap: "wrap" },
  editInput: {
    flex: 1,
    minWidth: 120,
    padding: "6px 10px",
    border: "1px solid #2a2a3a",
    background: "#0e0e14",
    color: "#e0e0ec",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  editSelect: {
    padding: "6px 8px",
    border: "1px solid #2a2a3a",
    background: "#0e0e14",
    color: "#e0e0ec",
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    appearance: "auto",
  },
  smallBtn: {
    width: 28,
    height: 28,
    border: "none",
    background: "#22222f",
    color: "#4ade80",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  smallBtnDanger: { color: "#ef4444" },

  // Setlist grid
  setlistGrid: { display: "flex", flexDirection: "column", gap: 8 },
  setlistCard: {
    position: "relative",
    padding: "18px 90px 18px 20px",
    background: "#16161f",
    borderRadius: 12,
    cursor: "pointer",
    border: "1px solid #2a2a3a",
    transition: "all 0.15s",
  },
  setlistCardName: { fontSize: 17, fontWeight: 600, marginBottom: 4 },
  setlistCardMeta: { fontSize: 13, color: "#707088" },
  setlistCardBtns: {
    position: "absolute",
    top: 12,
    right: 12,
    display: "flex",
    gap: 6,
  },

  // Setlist detail
  addToSetlistPanel: {
    background: "#16161f",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    maxHeight: 320,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  addToControls: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  addToSearch: {
    flex: 1,
    minWidth: 140,
    padding: "7px 12px",
    border: "1px solid #2a2a3a",
    background: "#0e0e14",
    color: "#e0e0ec",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  addToRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 0.1s",
    background: "#13131c",
  },
  addToName: { flex: 1, fontSize: 14, fontWeight: 500 },
  miniTag: { fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" },
  addIcon: { fontSize: 18, color: "#4ade80", fontWeight: 700, flexShrink: 0 },

  setlistSongs: { display: "flex", flexDirection: "column", gap: 2 },
  setlistItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "#13131c",
    borderRadius: 10,
    cursor: "grab",
    transition: "opacity 0.15s, border 0.1s",
    userSelect: "none",
  },
  dragHandle: {
    color: "#444",
    fontSize: 18,
    cursor: "grab",
    lineHeight: 1,
    flexShrink: 0,
  },
  setlistNum: {
    width: 26,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1e1e2e",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 700,
    color: "#707088",
    fontFamily: "'JetBrains Mono', monospace",
    flexShrink: 0,
  },

  // Import banner
  importBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "12px 16px",
    background: "#1e1a2e",
    border: "1px solid #3a2a5a",
    borderRadius: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  importBannerText: { fontSize: 14, color: "#c0b0e0", flex: 1 },
  importBannerBtn: {
    padding: "7px 16px",
    border: "1px solid #3a2a5a",
    background: "#2a1e4a",
    color: "#e0d0ff",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },
  importBannerBtnDanger: {
    background: "#2a1a1a",
    border: "1px solid #5a2a2a",
    color: "#ffb0b0",
  },
  importBannerCancel: {
    width: 28,
    height: 28,
    border: "none",
    background: "transparent",
    color: "#505068",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "sans-serif",
  },

  // Footer
  footer: {
    padding: "20px 0",
    borderTop: "1px solid #1e1e2e",
    textAlign: "center",
    fontSize: 12,
    color: "#404058",
  },
  footerLink: {
    color: "#404058",
    textDecoration: "none",
  },

  // Empty
  empty: { padding: 40, textAlign: "center", color: "#555", fontSize: 15 },
  emptySmall: { padding: 20, textAlign: "center", color: "#555", fontSize: 14 },
};

export default App;
