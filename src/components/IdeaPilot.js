"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./IdeaPilot.module.css";

const COLUMNS = [
  { id: "raw",       label: "💡 Brutas",      color: "#5B5BD6" },
  { id: "exploring", label: "🔍 Explorando",  color: "#C07A2A" },
  { id: "validated", label: "✅ Validadas",    color: "#3A7D5C" },
  { id: "building",  label: "🚀 Construindo", color: "#3A6FA8" },
  { id: "archived",  label: "📦 Arquivadas",  color: "#8A7E6E" },
];

function formatDate(date) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ─── Rich Text ────────────────────────────────────────────────────────────────
function RichText({ content, className }) {
  if (!content) return null;
  return (
    <div className={className}>
      {content.split("\n").map((line, i) => {
        if (line.startsWith("- ") || line.startsWith("• "))
          return <div key={i} style={{ display:"flex", gap:"6px", marginBottom:"2px" }}><span style={{ color:"var(--text3)", flexShrink:0 }}>•</span><span dangerouslySetInnerHTML={{ __html: parseInline(line.slice(2)) }} /></div>;
        if (line === "") return <br key={i} />;
        return <p key={i} style={{ marginBottom:"2px" }} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />;
      })}
    </div>
  );
}

function parseInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:var(--bg2);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>');
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function Toolbar({ textareaRef, onChange, value }) {
  const insert = (before, after, placeholder) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    const selected = value.slice(s, e) || placeholder;
    const newText = value.slice(0, s) + before + selected + after + value.slice(e);
    onChange(newText);
    setTimeout(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + selected.length); }, 0);
  };
  const insertLine = (prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + prefix.length, s + prefix.length); }, 0);
  };
  return (
    <div className={styles.toolbar}>
      {[
        { icon:"B", title:"Negrito", style:{fontWeight:800}, fn:() => insert("**","**","negrito") },
        { icon:"I", title:"Itálico", style:{fontStyle:"italic"}, fn:() => insert("*","*","itálico") },
        { icon:"•", title:"Lista", style:{}, fn:() => insertLine("- ") },
        { icon:"</>", title:"Código", style:{fontFamily:"monospace",fontSize:"11px"}, fn:() => insert("`","`","código") },
      ].map((t) => (
        <button key={t.icon} type="button" title={t.title} className={styles.toolbarBtn} style={t.style}
          onMouseDown={(e) => { e.preventDefault(); t.fn(); }}>{t.icon}</button>
      ))}
      <span className={styles.toolbarHint}>**negrito** · *itálico* · - lista</span>
    </div>
  );
}

// ─── IdeaCard ─────────────────────────────────────────────────────────────────
function IdeaCard({ idea, onDragStart, onDragEnd, onDragOver, onClick, isDragging, dropIndicator }) {
  const col = COLUMNS.find((c) => c.id === idea.status);
  return (
    <div style={{ position: "relative" }}>
      {dropIndicator === "top" && <div className={styles.dropIndicator} />}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, idea.id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, idea.id)}
        onClick={() => onClick(idea)}
        className={styles.card}
        style={{ opacity: isDragging ? 0.3 : 1, borderLeft: `3px solid ${col?.color || "#5B5BD6"}` }}
      >
        <p className={styles.cardTitle}>{idea.title}</p>
        {idea.body && <p className={styles.cardBody}>{idea.body.replace(/\*\*|__|\*|_|`/g, "")}</p>}
        <p className={styles.cardDate}>{formatDate(idea.created_at)}</p>
      </div>
      {dropIndicator === "bottom" && <div className={styles.dropIndicator} />}
    </div>
  );
}

// ─── BoardColumn ──────────────────────────────────────────────────────────────
function BoardColumn({ column, ideas, draggingId, dropTarget, onDragStart, onDragEnd, onDragOver, onDragOverColumn, onDrop, onCardClick }) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOverColumn(column.id); }}
      onDrop={(e) => { e.preventDefault(); onDrop(column.id); }}
      className={styles.column}
      style={{
        background: "rgba(237,231,218,0.8)",
        border: `1px solid rgba(160,140,110,0.2)`,
      }}
    >
      <div className={styles.columnHeader}>
        <div className={styles.columnDot} style={{ background: column.color }} />
        <span className={styles.columnLabel}>{column.label}</span>
        <span className={styles.columnCount}>{ideas.length}</span>
      </div>
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          isDragging={draggingId === idea.id}
          dropIndicator={dropTarget?.id === idea.id ? dropTarget.position : null}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}

// ─── ListRow ──────────────────────────────────────────────────────────────────
function ListRow({ idea, onClick }) {
  const col = COLUMNS.find((c) => c.id === idea.status);
  return (
    <div onClick={() => onClick(idea)} className={styles.listRow}>
      <div className={styles.listRowMain}>
        <p className={styles.listRowTitle}>{idea.title}</p>
        {idea.body && <p className={styles.listRowBody}>{idea.body.replace(/\*\*|__|\*|_|`/g, "")}</p>}
      </div>
      <span className={styles.listRowStatus} style={{ color:col?.color, background:`${col?.color}18`, border:`1px solid ${col?.color}33` }}>
        {col?.label}
      </span>
      <span className={styles.listRowDate}>{formatDate(idea.created_at)}</span>
    </div>
  );
}

// ─── IdeaModal ────────────────────────────────────────────────────────────────
function IdeaModal({ onClose, onSave, saving, initial }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [body, setBody] = useState(initial?.body || "");
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef(null);
  const isEdit = !!initial;
  const canSave = title.trim() && !saving;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth:"600px" }}>
        <h2 className={styles.modalTitle}>{isEdit ? "Editar ideia" : "Nova ideia"}</h2>
        <p className={styles.modalSubtitle}>{isEdit ? "Atualize o título ou a descrição." : "Jogue sua ideia aqui. Sem filtros, sem formato."}</p>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Título <span style={{ color:"var(--indigo)" }}>*</span></label>
          <input autoFocus={!isEdit} value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: App de controle financeiro por voz" className={styles.inputField}
            onFocus={(e) => (e.target.style.borderColor = "var(--indigo)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border2)")} />
        </div>

        <div className={styles.fieldGroup}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
            <label className={styles.fieldLabel}>Descrição <span style={{ color:"var(--text3)", fontWeight:400 }}>(opcional)</span></label>
            <button type="button" onClick={() => setPreview(!preview)} className={styles.previewToggle}>
              {preview ? "✏️ Editar" : "👁 Preview"}
            </button>
          </div>
          {!preview ? (
            <>
              <Toolbar textareaRef={textareaRef} onChange={setBody} value={body} />
              <textarea ref={textareaRef} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder={"Descreva a ideia, o problema que resolve...\n\nUse **negrito**, *itálico* ou - listas"}
                className={styles.textarea}
                style={{ borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:"none" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--indigo)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border2)")} />
            </>
          ) : (
            <div className={styles.previewBox}>
              {body
                ? <RichText content={body} className={styles.richText} />
                : <p style={{ color:"var(--text3)", fontSize:"13px", fontStyle:"italic" }}>Nada para visualizar ainda.</p>}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.btnCancel}>Cancelar</button>
          <button onClick={() => canSave && onSave(title.trim(), body.trim())} disabled={!canSave} className={styles.btnSave}
            style={{ background:canSave ? "var(--indigo)" : "var(--bg3)", color:canSave ? "#fff" : "var(--text3)", cursor:canSave ? "pointer" : "not-allowed" }}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações →" : "Salvar ideia →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────
function DetailModal({ idea, onClose, onMove, onDelete, onEdit }) {
  const [confirming, setConfirming] = useState(false);
  const col = COLUMNS.find((c) => c.id === idea.status);
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth:"560px" }}>
        <div className={styles.detailHeader}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"4px", height:"22px", borderRadius:"2px", background:col?.color, flexShrink:0 }} />
            <h2 className={styles.detailTitle}>{idea.title}</h2>
          </div>
          <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
            <button onClick={() => onEdit(idea)} className={styles.btnEdit} title="Editar">✏️</button>
            <button onClick={onClose} className={styles.btnClose}>✕</button>
          </div>
        </div>
        <div className={styles.detailBodyWrapper}>
          {idea.body
            ? <RichText content={idea.body} className={styles.detailRichBody} />
            : <p className={styles.detailBodyEmpty}>Sem descrição. Clique em ✏️ para adicionar.</p>}
        </div>
        <div className={styles.detailMoveSection}>
          <p className={styles.detailMoveLabel}>Mover para</p>
          <div className={styles.detailMoveButtons}>
            {COLUMNS.map((c) => (
              <button key={c.id} onClick={() => { onMove(idea.id, c.id); onClose(); }} className={styles.moveBtn}
                style={{ border:`1px solid ${c.id === idea.status ? c.color : "var(--border2)"}`, background:c.id === idea.status ? `${c.color}18` : "transparent", color:c.id === idea.status ? c.color : "var(--text2)", fontWeight:c.id === idea.status ? 700 : 400 }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.detailDeleteSection}>
          {!confirming ? (
            <button onClick={() => setConfirming(true)} className={styles.btnDelete}>🗑 Excluir ideia</button>
          ) : (
            <div className={styles.confirmBox}>
              <p className={styles.confirmText}>Tem certeza? Esta ação não pode ser desfeita.</p>
              <div className={styles.confirmActions}>
                <button onClick={() => setConfirming(false)} className={styles.btnCancelDelete}>Cancelar</button>
                <button onClick={() => { onDelete(idea.id); onClose(); }} className={styles.btnConfirmDelete}>Sim, excluir</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function IdeaPilot() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("board");
  const [showNew, setShowNew] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [search, setSearch] = useState("");

  // Drag state
  const draggingId = useRef(null);
  const [draggingIdState, setDraggingIdState] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { id, position: "top"|"bottom", column }
  const currentColumn = useRef(null);

  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      const { data, error } = await supabase.from("ideas").select("*").order("position");
      if (!error) setIdeas(data || []);
      setLoading(false);
    }
    fetchIdeas();
  }, []);

  const handleDragStart = useCallback((e, id) => {
    draggingId.current = id;
    setDraggingIdState(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    draggingId.current = null;
    setDraggingIdState(null);
    setDropTarget(null);
    currentColumn.current = null;
  }, []);

  // Detect top/bottom half of a card
  const handleDragOver = useCallback((e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (targetId === draggingId.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? "top" : "bottom";
    setDropTarget((prev) =>
      prev?.id === targetId && prev?.position === position ? prev : { id: targetId, position }
    );
  }, []);

  const handleDragOverColumn = useCallback((colId) => {
    currentColumn.current = colId;
  }, []);

  const handleDrop = useCallback(async (columnId) => {
    const id = draggingId.current;
    if (!id) return;

    setIdeas((prev) => {
      const dragged = prev.find((i) => i.id === id);
      if (!dragged) return prev;

      let newList = prev.filter((i) => i.id !== id);

      if (dropTarget) {
        // Insert relative to dropTarget
        const targetIdx = newList.findIndex((i) => i.id === dropTarget.id);
        const insertIdx = dropTarget.position === "top" ? targetIdx : targetIdx + 1;
        newList.splice(insertIdx, 0, { ...dragged, status: columnId });
      } else {
        // Append to end of column
        newList.push({ ...dragged, status: columnId });
      }

      // Reindex positions per column
      const reindexed = newList.map((item) => ({
        ...item,
        position: newList.filter((i) => i.status === item.status).indexOf(item),
      }));

      // Persist to Supabase
      const colItems = reindexed.filter((i) => i.status === columnId);
      colItems.forEach(async (item) => {
        await supabase.from("ideas").update({ status: item.status, position: item.position }).eq("id", item.id);
      });
      if (dragged.status !== columnId) {
        const oldColItems = reindexed.filter((i) => i.status === dragged.status);
        oldColItems.forEach(async (item) => {
          await supabase.from("ideas").update({ position: item.position }).eq("id", item.id);
        });
      }

      return reindexed;
    });

    draggingId.current = null;
    setDraggingIdState(null);
    setDropTarget(null);
    currentColumn.current = null;
  }, [dropTarget]);

  const handleSaveIdea = async (title, body) => {
    setSaving(true);
    const colCount = ideas.filter((i) => i.status === "raw").length;
    const { data, error } = await supabase
      .from("ideas").insert([{ title, body, status: "raw", position: colCount }])
      .select().single();
    if (!error) { setIdeas((prev) => [...prev, data]); setShowNew(false); }
    setSaving(false);
  };

  const handleEditIdea = async (title, body) => {
    setSaving(true);
    const id = editingIdea.id;
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, title, body } : i));
    await supabase.from("ideas").update({ title, body }).eq("id", id);
    setEditingIdea(null);
    setSaving(false);
  };

  const handleMove = async (ideaId, columnId) => {
    const colCount = ideas.filter((i) => i.status === columnId && i.id !== ideaId).length;
    setIdeas((prev) => prev.map((i) => i.id === ideaId ? { ...i, status: columnId, position: colCount } : i));
    await supabase.from("ideas").update({ status: columnId, position: colCount }).eq("id", ideaId);
  };

  const handleDelete = async (ideaId) => {
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    await supabase.from("ideas").delete().eq("id", ideaId);
  };

  const handleEditFromDetail = (idea) => {
    setSelectedIdea(null);
    setEditingIdea(idea);
  };

  const filtered = ideas.filter(
    (i) => i.title.toLowerCase().includes(search.toLowerCase()) || i.body?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedByColumn = (colId) =>
    filtered.filter((i) => i.status === colId).sort((a, b) => a.position - b.position);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>💡</div>
          <span className={styles.brandName}>IdeaPilot</span>
          <span className={styles.mvpBadge}>MVP</span>
        </div>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ideias..." className={styles.searchInput} />
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            {[{ id:"board", icon:"⊞", label:"Board" }, { id:"list", icon:"☰", label:"Lista" }].map((v) => (
              <button key={v.id} onClick={() => setView(v.id)} className={styles.viewBtn}
                style={{ background:view === v.id ? "var(--card)" : "transparent", color:view === v.id ? "var(--indigo)" : "var(--text3)", boxShadow:view === v.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNew(true)} className={styles.btnNew}>+ Nova ideia</button>
        </div>
      </header>

      <div className={styles.statsBar}>
        {COLUMNS.map((col) => (
          <div key={col.id} className={styles.statItem}>
            <div className={styles.statDot} style={{ background:col.color }} />
            <span className={styles.statLabel}>{col.label.split(" ").slice(1).join(" ")}</span>
            <span className={styles.statCount}>{ideas.filter((i) => i.status === col.id).length}</span>
          </div>
        ))}
        <div className={styles.statTotal}>Total: <strong>{ideas.length}</strong> ideias</div>
      </div>

      {loading && <div className={styles.emptyState}><div className={styles.emptyIcon}>⏳</div><p className={styles.emptyText}>Carregando ideias...</p></div>}

      {!loading && view === "board" && (
        <div className={styles.boardWrapper}>
          <div className={styles.board}>
            {COLUMNS.map((col) => (
              <BoardColumn key={col.id} column={col}
                ideas={sortedByColumn(col.id)}
                draggingId={draggingIdState}
                dropTarget={dropTarget}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragOverColumn={handleDragOverColumn}
                onDrop={handleDrop}
                onCardClick={setSelectedIdea} />
            ))}
          </div>
        </div>
      )}

      {!loading && view === "list" && (
        <div className={styles.listWrapper}>
          <div className={styles.listContainer}>
            <div className={styles.listHeader}>
              {["Ideia","Status","Data"].map((h) => <span key={h} className={styles.listHeaderCell}>{h}</span>)}
            </div>
            {filtered.length === 0 && <p className={styles.emptyList}>Nenhuma ideia encontrada.</p>}
            {COLUMNS.flatMap((col) => sortedByColumn(col.id)).map((idea) => <ListRow key={idea.id} idea={idea} onClick={setSelectedIdea} />)}
          </div>
        </div>
      )}

      {!loading && ideas.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💡</div>
          <p className={styles.emptyText}>Sua primeira ideia está esperando.</p>
          <button onClick={() => setShowNew(true)} className={styles.btnNew}>Adicionar agora</button>
        </div>
      )}

      {showNew && <IdeaModal onClose={() => setShowNew(false)} onSave={handleSaveIdea} saving={saving} />}
      {editingIdea && <IdeaModal onClose={() => setEditingIdea(null)} onSave={handleEditIdea} saving={saving} initial={editingIdea} />}
      {selectedIdea && (
        <DetailModal idea={selectedIdea} onClose={() => setSelectedIdea(null)}
          onMove={handleMove} onDelete={handleDelete} onEdit={handleEditFromDetail} />
      )}
    </div>
  );
}
