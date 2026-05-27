"use client";

import { useState, useCallback, useEffect } from "react";
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
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// ─── IdeaCard ────────────────────────────────────────────────────────────────
function IdeaCard({ idea, onDragStart, onClick, isDragging }) {
  const col = COLUMNS.find((c) => c.id === idea.status);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, idea.id)}
      onClick={() => onClick(idea)}
      className={styles.card}
      style={{
        opacity: isDragging ? 0.35 : 1,
        borderLeft: `3px solid ${col?.color || "#5B5BD6"}`,
      }}
    >
      <p className={styles.cardTitle}>{idea.title}</p>
      {idea.body && <p className={styles.cardBody}>{idea.body}</p>}
      <p className={styles.cardDate}>{formatDate(idea.created_at)}</p>
    </div>
  );
}

// ─── BoardColumn ─────────────────────────────────────────────────────────────
function BoardColumn({ column, ideas, onDragStart, onDrop, onCardClick, draggingId }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { setIsOver(false); onDrop(e, column.id); }}
      className={styles.column}
      style={{
        background: isOver ? "rgba(91,91,214,0.07)" : "rgba(237,231,218,0.8)",
        border: `1px solid ${isOver ? "rgba(91,91,214,0.35)" : "rgba(160,140,110,0.2)"}`,
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
          onDragStart={onDragStart}
          onClick={onCardClick}
          isDragging={draggingId === idea.id}
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
        {idea.body && <p className={styles.listRowBody}>{idea.body}</p>}
      </div>
      <span
        className={styles.listRowStatus}
        style={{ color: col?.color, background: `${col?.color}18`, border: `1px solid ${col?.color}33` }}
      >
        {col?.label}
      </span>
      <span className={styles.listRowDate}>{formatDate(idea.created_at)}</span>
    </div>
  );
}

// ─── NewIdeaModal ─────────────────────────────────────────────────────────────
function NewIdeaModal({ onClose, onSave, saving }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const canSave = title.trim() && !saving;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Nova ideia</h2>
        <p className={styles.modalSubtitle}>
          Jogue sua ideia aqui. Sem filtros, sem formato.
        </p>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Título <span style={{color:"var(--indigo)"}}>*</span>
          </label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: App de controle financeiro por voz"
            className={styles.inputField}
            onFocus={(e) => (e.target.style.borderColor = "var(--indigo)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Descrição <span style={{color:"var(--text3)",fontWeight:400}}>(opcional)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Descreva a ideia, o problema que resolve, como surgiu..."
            className={styles.textarea}
            onFocus={(e) => (e.target.style.borderColor = "var(--indigo)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border2)")}
          />
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.btnCancel}>
            Cancelar
          </button>
          <button
            onClick={() => canSave && onSave(title.trim(), body.trim())}
            disabled={!canSave}
            className={styles.btnSave}
            style={{
              background: canSave ? "var(--indigo)" : "var(--bg3)",
              color: canSave ? "#fff" : "var(--text3)",
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Salvando..." : "Salvar ideia →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────
function DetailModal({ idea, onClose, onMove }) {
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.detailHeader}>
          <h2 className={styles.detailTitle}>{idea.title}</h2>
          <button onClick={onClose} className={styles.btnClose}>✕</button>
        </div>
        <p className={styles.detailBody}>{idea.body || "Sem descrição."}</p>
        <div className={styles.detailMoveSection}>
          <p className={styles.detailMoveLabel}>Mover para</p>
          <div className={styles.detailMoveButtons}>
            {COLUMNS.map((c) => (
              <button
                key={c.id}
                onClick={() => { onMove(idea.id, c.id); onClose(); }}
                className={styles.moveBtn}
                style={{
                  border: `1px solid ${c.id === idea.status ? c.color : "var(--border2)"}`,
                  background: c.id === idea.status ? `${c.color}18` : "transparent",
                  color: c.id === idea.status ? c.color : "var(--text2)",
                  fontWeight: c.id === idea.status ? 700 : 400,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
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
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [search, setSearch] = useState("");

  // ─── Carregar ideias do Supabase ──────────────────────────────────
  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar ideias:", error);
      } else {
        setIdeas(data || []);
      }
      setLoading(false);
    }
    fetchIdeas();
  }, []);

  // ─── Drag & Drop ──────────────────────────────────────────────────
  const handleDragStart = useCallback((e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = useCallback(async (e, columnId) => {
    e.preventDefault();
    const id = draggingId;
    setDraggingId(null);

    // Atualiza local imediatamente (otimista)
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, status: columnId } : i));

    // Persiste no banco
    const { error } = await supabase
      .from("ideas")
      .update({ status: columnId })
      .eq("id", id);

    if (error) console.error("Erro ao mover ideia:", error);
  }, [draggingId]);

  // ─── Salvar nova ideia ────────────────────────────────────────────
  const handleSaveIdea = async (title, body) => {
    setSaving(true);

    const { data, error } = await supabase
      .from("ideas")
      .insert([{ title, body, status: "raw" }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar ideia:", error);
    } else {
      setIdeas((prev) => [data, ...prev]);
      setShowNew(false);
    }
    setSaving(false);
  };

  // ─── Mover ideia (modal) ──────────────────────────────────────────
  const handleMove = async (ideaId, columnId) => {
    setIdeas((prev) => prev.map((i) => i.id === ideaId ? { ...i, status: columnId } : i));

    const { error } = await supabase
      .from("ideas")
      .update({ status: columnId })
      .eq("id", ideaId);

    if (error) console.error("Erro ao mover ideia:", error);
  };

  const filtered = ideas.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.body?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>💡</div>
          <span className={styles.brandName}>IdeaPilot</span>
          <span className={styles.mvpBadge}>MVP</span>
        </div>

        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ideias..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            {[
              { id: "board", icon: "⊞", label: "Board" },
              { id: "list", icon: "☰", label: "Lista" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={styles.viewBtn}
                style={{
                  background: view === v.id ? "var(--card)" : "transparent",
                  color: view === v.id ? "var(--indigo)" : "var(--text3)",
                  boxShadow: view === v.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>

          <button onClick={() => setShowNew(true)} className={styles.btnNew}>
            + Nova ideia
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        {COLUMNS.map((col) => {
          const count = ideas.filter((i) => i.status === col.id).length;
          return (
            <div key={col.id} className={styles.statItem}>
              <div className={styles.statDot} style={{ background: col.color }} />
              <span className={styles.statLabel}>
                {col.label.split(" ").slice(1).join(" ")}
              </span>
              <span className={styles.statCount}>{count}</span>
            </div>
          );
        })}
        <div className={styles.statTotal}>
          Total: <strong>{ideas.length}</strong> ideias
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⏳</div>
          <p className={styles.emptyText}>Carregando ideias...</p>
        </div>
      )}

      {/* Board View */}
      {!loading && view === "board" && (
        <div className={styles.boardWrapper}>
          <div className={styles.board}>
            {COLUMNS.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                ideas={filtered.filter((i) => i.status === col.id)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onCardClick={setSelectedIdea}
                draggingId={draggingId}
              />
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {!loading && view === "list" && (
        <div className={styles.listWrapper}>
          <div className={styles.listContainer}>
            <div className={styles.listHeader}>
              {["Ideia", "Status", "Data"].map((h) => (
                <span key={h} className={styles.listHeaderCell}>{h}</span>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className={styles.emptyList}>Nenhuma ideia encontrada.</p>
            )}
            {filtered.map((idea) => (
              <ListRow key={idea.id} idea={idea} onClick={setSelectedIdea} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && ideas.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💡</div>
          <p className={styles.emptyText}>Sua primeira ideia está esperando.</p>
          <button onClick={() => setShowNew(true)} className={styles.btnNew}>
            Adicionar agora
          </button>
        </div>
      )}

      {showNew && (
        <NewIdeaModal
          onClose={() => setShowNew(false)}
          onSave={handleSaveIdea}
          saving={saving}
        />
      )}
      {selectedIdea && (
        <DetailModal
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onMove={handleMove}
        />
      )}
    </div>
  );
}
