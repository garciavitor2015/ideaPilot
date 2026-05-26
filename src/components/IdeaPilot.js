"use client";

import { useState, useCallback } from "react";
import styles from "./IdeaPilot.module.css";

const COLUMNS = [
  { id: "raw",       label: "💡 Brutas",      color: "#5B5BD6" },
  { id: "exploring", label: "🔍 Explorando",  color: "#C07A2A" },
  { id: "validated", label: "✅ Validadas",    color: "#3A7D5C" },
  { id: "building",  label: "🚀 Construindo", color: "#3A6FA8" },
  { id: "archived",  label: "📦 Arquivadas",  color: "#8A7E6E" },
];

const INITIAL_IDEAS = [
  {
    id: "1",
    title: "App de controle financeiro por voz",
    body: "Usuário fala o gasto e o app registra automaticamente usando IA de transcrição. Integração com bancos via open finance.",
    column: "raw",
    createdAt: new Date("2025-05-20"),
  },
  {
    id: "2",
    title: "Marketplace de serviços locais",
    body: "Conectar prestadores de serviço (encanadores, eletricistas) com clientes via geolocalização e avaliações.",
    column: "exploring",
    createdAt: new Date("2025-05-18"),
  },
  {
    id: "3",
    title: "Plataforma de mentorias por assinatura",
    body: "Mentores especializados disponíveis via assinatura mensal. Sessões rápidas de 30 minutos com especialistas.",
    column: "validated",
    createdAt: new Date("2025-05-10"),
  },
  {
    id: "4",
    title: "IA para análise de contratos",
    body: "Enviar PDF de contrato e receber análise de riscos, cláusulas problemáticas e sugestões de melhoria.",
    column: "building",
    createdAt: new Date("2025-05-01"),
  },
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
  const col = COLUMNS.find((c) => c.id === idea.column);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, idea.id)}
      onClick={() => onClick(idea)}
      className={styles.card}
      style={{
        opacity: isDragging ? 0.35 : 1,
        borderLeft: `3px solid ${col?.color || "#6366f1"}`,
      }}
    >
      <p className={styles.cardTitle}>{idea.title}</p>
      {idea.body && <p className={styles.cardBody}>{idea.body}</p>}
      <p className={styles.cardDate}>{formatDate(idea.createdAt)}</p>
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
  const col = COLUMNS.find((c) => c.id === idea.column);
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
      <span className={styles.listRowDate}>{formatDate(idea.createdAt)}</span>
    </div>
  );
}

// ─── NewIdeaModal ─────────────────────────────────────────────────────────────
function NewIdeaModal({ onClose, onSave }) {
  const [text, setText] = useState("");

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Nova ideia</h2>
        <p className={styles.modalSubtitle}>
          Jogue sua ideia bruta aqui. Sem filtros, sem formato.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex: Um app que transcreve reuniões e já cria tarefas no Notion automaticamente..."
          className={styles.textarea}
          onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.6)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.btnCancel}>
            Cancelar
          </button>
          <button
            onClick={() => text.trim() && onSave(text.trim())}
            disabled={!text.trim()}
            className={styles.btnSave}
            style={{
              background: text.trim()
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "rgba(255,255,255,0.05)",
              color: text.trim() ? "#fff" : "#475569",
              cursor: text.trim() ? "pointer" : "not-allowed",
            }}
          >
            Salvar ideia →
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
                  border: `1px solid ${c.id === idea.column ? c.color : "rgba(255,255,255,0.08)"}`,
                  background: c.id === idea.column ? `${c.color}20` : "transparent",
                  color: c.id === idea.column ? c.color : "#94a3b8",
                  fontWeight: c.id === idea.column ? 700 : 400,
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
  const [ideas, setIdeas] = useState(INITIAL_IDEAS);
  const [view, setView] = useState("board");
  const [showNew, setShowNew] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [search, setSearch] = useState("");

  const handleDragStart = useCallback((e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = useCallback(
    (e, columnId) => {
      e.preventDefault();
      setIdeas((prev) =>
        prev.map((i) => (i.id === draggingId ? { ...i, column: columnId } : i))
      );
      setDraggingId(null);
    },
    [draggingId]
  );

  const handleSaveIdea = (text) => {
    const lines = text.split("\n").filter(Boolean);
    const title = lines[0].slice(0, 80);
    const body = lines.slice(1).join(" ").trim() || text.slice(title.length).trim();
    setIdeas((prev) => [
      { id: generateId(), title, body, column: "raw", createdAt: new Date() },
      ...prev,
    ]);
    setShowNew(false);
  };

  const handleMove = (ideaId, columnId) => {
    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, column: columnId } : i))
    );
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
                  background: view === v.id ? "rgba(99,102,241,0.3)" : "transparent",
                  color: view === v.id ? "#818cf8" : "#64748b",
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
          const count = ideas.filter((i) => i.column === col.id).length;
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

      {/* Board View */}
      {view === "board" && (
        <div className={styles.boardWrapper}>
          <div className={styles.board}>
            {COLUMNS.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                ideas={filtered.filter((i) => i.column === col.id)}
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
      {view === "list" && (
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
      {ideas.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💡</div>
          <p className={styles.emptyText}>Sua primeira ideia está esperando.</p>
          <button onClick={() => setShowNew(true)} className={styles.btnNew}>
            Adicionar agora
          </button>
        </div>
      )}

      {showNew && (
        <NewIdeaModal onClose={() => setShowNew(false)} onSave={handleSaveIdea} />
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
