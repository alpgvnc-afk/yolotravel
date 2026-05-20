import { useReducer, useState, useEffect, Fragment, ReactNode, CSSProperties } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, useDroppable, closestCenter,
  DragStartEvent, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, Star, Save, X, Sparkles, Loader2, AlertTriangle, Clock,
} from 'lucide-react';
import { TripPlan, DayPlan, ActivityBlock } from '../types';
import { getDaySpots, makeSpot, emojiForType } from '../utils/planSpots';
import { fetchPlaceDetails } from '../services/placesService';
import { askForAlternative, AlternativeSpot } from '../services/claudeService';
import SpotEditMenu from './SpotEditMenu';
import PlacesSearchModal from './PlacesSearchModal';
import { LANG } from '../i18n';

/* ───────────────────────────────────────────────────────────── reducer ── */

type Action =
  | { t: 'setDays'; days: DayPlan[] }
  | { t: 'remove'; di: number; id: string }
  | { t: 'add'; di: number; spot: ActivityBlock }
  | { t: 'replace'; di: number; id: string; spot: ActivityBlock }
  | { t: 'time'; di: number; id: string; time: string };

function initDays(plan: TripPlan): DayPlan[] {
  return plan.days_plan.map(d => ({ ...d, spots: getDaySpots(d) }));
}

function reducer(state: DayPlan[], a: Action): DayPlan[] {
  switch (a.t) {
    case 'setDays':
      return a.days;
    case 'remove':
      return state.map((d, i) => i === a.di
        ? { ...d, spots: (d.spots || []).filter(s => s.id !== a.id) } : d);
    case 'add':
      return state.map((d, i) => i === a.di
        ? { ...d, spots: [...(d.spots || []), a.spot] } : d);
    case 'replace':
      return state.map((d, i) => i === a.di
        ? { ...d, spots: (d.spots || []).map(s => s.id === a.id ? { ...a.spot, id: s.id } : s) } : d);
    case 'time':
      return state.map((d, i) => i === a.di
        ? { ...d, spots: (d.spots || []).map(s => s.id === a.id ? { ...s, time: a.time } : s) } : d);
    default:
      return state;
  }
}

function findSpot(days: DayPlan[], id: string): { di: number; si: number } | null {
  for (let di = 0; di < days.length; di++) {
    const si = (days[di].spots || []).findIndex(s => s.id === id);
    if (si >= 0) return { di, si };
  }
  return null;
}

/* ─────────────────────────────────────────────────────────── component ── */

interface PlanEditorProps {
  plan: TripPlan;
  city: string;
  vibe: string;
  saving?: boolean;
  onSave: (updated: TripPlan) => void;
  onDiscard: () => void;
}

export default function PlanEditor({ plan, city, vibe, saving, onSave, onDiscard }: PlanEditorProps) {
  const [days, dispatch] = useReducer(reducer, plan, initDays);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [placesModal, setPlacesModal] = useState<{ mode: 'add' | 'replace'; di: number; id?: string } | null>(null);
  const [aiModal, setAiModal] = useState<{ di: number; day: number; spot: ActivityBlock } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ di: number; spot: ActivityBlock } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeSpot = activeId ? (findSpot(days, activeId) && days[findSpot(days, activeId)!.di].spots![findSpot(days, activeId)!.si]) : null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    if (activeKey === overKey) return;

    const from = findSpot(days, activeKey);
    if (!from) return;

    let toDi: number;
    let toSi: number;
    if (overKey.startsWith('day-')) {
      toDi = Number(overKey.slice(4));
      toSi = (days[toDi].spots || []).length;
    } else {
      const to = findSpot(days, overKey);
      if (!to) return;
      toDi = to.di;
      toSi = to.si;
    }

    const next = days.map(d => ({ ...d, spots: [...(d.spots || [])] }));
    const [moved] = next[from.di].spots.splice(from.si, 1);
    if (from.di === toDi && from.si < toSi) toSi -= 1;
    next[toDi].spots.splice(toSi, 0, moved);
    dispatch({ t: 'setDays', days: next });
  };

  const handleSave = () => {
    onSave({ ...plan, days_plan: days, editedAt: new Date().toISOString() });
  };

  return (
    <div className="mx-6 mt-2 pb-40">
      {/* edit banner */}
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <p className="text-xs font-medium text-amber-200">
          {LANG === 'tr'
            ? 'Düzenleme modu — sürükle, kaldır, değiştir veya saatleri ayarla.'
            : 'Edit mode — drag, remove, replace, or set times.'}
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {days.map((day, di) => (
          <section key={day.day} className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-amber-400 px-2 text-xs font-bold text-black">
                {LANG === 'tr' ? `Gün ${day.day}` : `Day ${day.day}`}
              </span>
              <span className="text-xs text-neutral-500">
                {(day.spots || []).length} {LANG === 'tr' ? 'durak' : 'stops'}
              </span>
            </div>

            <DayColumn di={di}>
              <SortableContext items={(day.spots || []).map(s => s.id!)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {(day.spots || []).map(spot => (
                    <Fragment key={spot.id}>
                    <SortableSpot
                      spot={spot}
                      onTime={(id, t) => dispatch({ t: 'time', di, id, time: t })}
                      onRemove={() => setConfirmRemove({ di, spot })}
                      onReplace={() => setPlacesModal({ mode: 'replace', di, id: spot.id! })}
                      onAskAI={() => setAiModal({ di, day: day.day, spot })}
                    />
                    </Fragment>
                  ))}
                  {(day.spots || []).length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/15 py-6 text-center text-xs text-neutral-500">
                      {LANG === 'tr' ? 'Bu gün boş — bir durak ekle' : 'Empty day — add a stop'}
                    </div>
                  )}
                </div>
              </SortableContext>

              <button
                onClick={() => setPlacesModal({ mode: 'add', di })}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-400/40 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-400/10"
              >
                <Plus className="h-4 w-4" />
                {LANG === 'tr' ? 'Durak Ekle' : 'Add Stop'}
              </button>
            </DayColumn>
          </section>
        ))}

        <DragOverlay>
          {activeSpot ? <SpotCardStatic spot={activeSpot} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* floating save / discard */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-3 bg-gradient-to-t from-black via-black/90 to-transparent px-6 pb-6 pt-10">
        <button
          onClick={onDiscard}
          className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#141414] px-5 py-3 text-sm font-bold text-white active:scale-[0.98]"
        >
          <X className="h-4 w-4" />
          {LANG === 'tr' ? 'Vazgeç' : 'Discard'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="glow-amber flex flex-1 max-w-xs items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-black active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {LANG === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
        </button>
      </div>

      {/* modals */}
      {placesModal && (
        <PlacesSearchModal
          city={city}
          title={placesModal.mode === 'add'
            ? (LANG === 'tr' ? 'Durak ekle' : 'Add a stop')
            : (LANG === 'tr' ? 'Yerine koy' : 'Replace with')}
          onClose={() => setPlacesModal(null)}
          onSelect={(spot) => {
            if (placesModal.mode === 'add') dispatch({ t: 'add', di: placesModal.di, spot });
            else dispatch({ t: 'replace', di: placesModal.di, id: placesModal.id!, spot });
            setPlacesModal(null);
          }}
        />
      )}

      {aiModal && (
        <AiAlternativesModal
          city={city}
          vibe={vibe}
          day={aiModal.day}
          spot={aiModal.spot}
          onClose={() => setAiModal(null)}
          onPick={(spot) => {
            dispatch({ t: 'replace', di: aiModal.di, id: aiModal.spot.id!, spot });
            setAiModal(null);
          }}
        />
      )}

      {confirmRemove && (
        <ConfirmDialog
          title={LANG === 'tr' ? 'Durağı kaldır?' : 'Remove this stop?'}
          message={confirmRemove.spot.title}
          confirmLabel={LANG === 'tr' ? 'Kaldır' : 'Remove'}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => {
            dispatch({ t: 'remove', di: confirmRemove.di, id: confirmRemove.spot.id! });
            setConfirmRemove(null);
          }}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── sub-components ── */

function DayColumn({ di, children }: { di: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${di}` });
  return (
    <div ref={setNodeRef} className={`rounded-2xl transition ${isOver ? 'ring-2 ring-amber-400/40' : ''}`}>
      {children}
    </div>
  );
}

function SortableSpot({
  spot, onTime, onRemove, onReplace, onAskAI,
}: {
  spot: ActivityBlock;
  onTime: (id: string, t: string) => void;
  onRemove: () => void;
  onReplace: () => void;
  onAskAI: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: spot.id! });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.4 : 1,
  };
  const pd = spot.placeDetails;

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#141414] p-2.5 shadow-lg shadow-black/30">
      <button
        {...attributes} {...listeners}
        style={{ touchAction: 'none' }}
        className="flex h-9 w-7 flex-shrink-0 cursor-grab items-center justify-center rounded-lg text-neutral-500 hover:bg-white/5 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
        {pd?.photoUrl ? (
          <img src={pd.photoUrl} alt={spot.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">{emojiForType(spot.type)}</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <label className="flex w-fit items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
          <Clock className="h-3 w-3" />
          <input
            type="time"
            value={spot.time || ''}
            onChange={(e) => onTime(spot.id!, e.target.value)}
            className="bg-transparent font-mono text-[11px] text-amber-200 outline-none [color-scheme:dark]"
          />
        </label>
        <div className="mt-0.5 truncate text-sm font-bold text-white">
          {emojiForType(spot.type)} {spot.title}
        </div>
        {pd?.rating ? (
          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-white">{pd.rating.toFixed(1)}</span>
            {spot.duration ? <span>· {spot.duration}</span> : null}
          </div>
        ) : spot.duration ? (
          <div className="text-[11px] text-neutral-400">{spot.duration}</div>
        ) : null}
      </div>

      <SpotEditMenu onRemove={onRemove} onReplace={onReplace} onAskAI={onAskAI} />
    </div>
  );
}

function SpotCardStatic({ spot, dragging }: { spot: ActivityBlock; dragging?: boolean }) {
  const pd = spot.placeDetails;
  return (
    <div className={`flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-[#1a1a1a] p-2.5 shadow-2xl ${dragging ? 'scale-105' : ''}`}>
      <GripVertical className="h-4 w-4 text-neutral-500" />
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
        {pd?.photoUrl ? <img src={pd.photoUrl} alt="" className="h-full w-full object-cover" /> : (
          <div className="flex h-full w-full items-center justify-center text-xl">{emojiForType(spot.type)}</div>
        )}
      </div>
      <div className="truncate text-sm font-bold text-white">{spot.title}</div>
    </div>
  );
}

function AiAlternativesModal({
  city, vibe, day, spot, onClose, onPick,
}: {
  city: string; vibe: string; day: number; spot: ActivityBlock;
  onClose: () => void; onPick: (spot: ActivityBlock) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alts, setAlts] = useState<AlternativeSpot[]>([]);
  const [picking, setPicking] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    askForAlternative({ city, vibe, day, category: spot.type, currentSpot: spot.title })
      .then(a => { if (!cancelled) { setAlts(a); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e?.message || 'Failed'); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = async (alt: AlternativeSpot, i: number) => {
    setPicking(i);
    const pd = await fetchPlaceDetails(`${alt.name}, ${city}`);
    onPick(makeSpot({
      title: alt.name, description: alt.description, type: alt.type,
      duration: alt.duration, placeDetails: pd,
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0f0f0f] p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            {LANG === 'tr' ? 'AI Alternatifleri' : 'AI Alternatives'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-xs text-neutral-500">
          {LANG === 'tr' ? `"${spot.title}" yerine` : `Instead of "${spot.title}"`}
        </p>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            {LANG === 'tr' ? 'Öneriler hazırlanıyor…' : 'Thinking…'}
          </div>
        )}
        {error && <p className="py-6 text-center text-sm text-red-400">{error}</p>}

        <div className="space-y-2">
          {alts.map((alt, i) => (
            <button
              key={i}
              onClick={() => choose(alt, i)}
              disabled={picking !== null}
              className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-[#141414] p-3 text-left transition hover:border-emerald-400/50 disabled:opacity-60"
            >
              <span className="text-xl">{emojiForType(alt.type)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white">{alt.name}</div>
                <div className="mt-0.5 text-xs text-neutral-400">{alt.description}</div>
              </div>
              {picking === i && <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title, message, confirmLabel, onCancel, onConfirm,
}: {
  title: string; message: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0f0f0f] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="mt-1 truncate text-sm text-neutral-400">{message}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={onCancel} className="rounded-2xl border border-white/15 bg-[#141414] py-3 text-sm font-bold text-white active:scale-[0.98]">
            {LANG === 'tr' ? 'İptal' : 'Cancel'}
          </button>
          <button onClick={onConfirm} className="rounded-2xl bg-red-500 py-3 text-sm font-bold text-white active:scale-[0.98]">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
