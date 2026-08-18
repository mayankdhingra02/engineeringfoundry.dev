"use client";

import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CoreRoadmapTrack } from "@/data/dsa/core-roadmap";
import { createRoadmapLayout, getRoadmapAncestors, getRoadmapNeighbors, ROADMAP_NODE_HEIGHT, ROADMAP_NODE_WIDTH } from "./roadmap-layout";
import { RoadmapNode } from "./roadmap-node";

type Viewport = { x: number; y: number; scale: number };

function clampScale(scale: number) {
  return Math.min(1.35, Math.max(.48, scale));
}

export function RoadmapCanvas({ track, questionCounts, selectedId, onSelect }: {
  track: CoreRoadmapTrack;
  questionCounts: Record<string, number>;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const layout = useMemo(() => createRoadmapLayout(track), [track]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 24, y: 24, scale: .78 });
  const [dragging, setDragging] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fitView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scale = clampScale(Math.min((container.clientWidth - 34) / layout.width, (container.clientHeight - 34) / layout.height, 1));
    setViewport({ x: (container.clientWidth - layout.width * scale) / 2, y: Math.max(16, (container.clientHeight - layout.height * scale) / 2), scale });
  }, [layout.height, layout.width]);

  const centerTopic = useCallback((id: string) => {
    const container = containerRef.current;
    const node = layout.nodes.find((item) => item.topic.id === id);
    if (!container || !node) return;
    setViewport((current) => ({
      scale: current.scale,
      x: container.clientWidth / 2 - (node.x + ROADMAP_NODE_WIDTH / 2) * current.scale,
      y: container.clientHeight / 2 - (node.y + ROADMAP_NODE_HEIGHT / 2) * current.scale,
    }));
  }, [layout.nodes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const syncViewport = () => selectedId ? centerTopic(selectedId) : fitView();
    const observer = new ResizeObserver(syncViewport);
    observer.observe(container);
    const frame = requestAnimationFrame(syncViewport);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [centerTopic, fitView, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const frame = requestAnimationFrame(() => centerTopic(selectedId));
    return () => cancelAnimationFrame(frame);
  }, [centerTopic, selectedId]);

  const selectedPath = useMemo(() => selectedId ? new Set([selectedId, ...getRoadmapAncestors(track, selectedId)]) : new Set<string>(), [selectedId, track]);
  const hoveredNeighbors = useMemo(() => hoveredId ? getRoadmapNeighbors(track, hoveredId) : new Set<string>(), [hoveredId, track]);

  function zoomBy(amount: number) {
    const container = containerRef.current;
    if (!container) return;
    setViewport((current) => {
      const nextScale = clampScale(current.scale + amount);
      const ratio = nextScale / current.scale;
      return { scale: nextScale, x: container.clientWidth / 2 - (container.clientWidth / 2 - current.x) * ratio, y: container.clientHeight / 2 - (container.clientHeight / 2 - current.y) * ratio };
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: viewport.x, originY: viewport.y };
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setViewport((current) => ({ ...current, x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY }));
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaY) < 2) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const pointX = event.clientX - rect.left;
    const pointY = event.clientY - rect.top;
    setViewport((current) => {
      const nextScale = clampScale(current.scale + (event.deltaY > 0 ? -.08 : .08));
      const ratio = nextScale / current.scale;
      return { scale: nextScale, x: pointX - (pointX - current.x) * ratio, y: pointY - (pointY - current.y) * ratio };
    });
  }

  return <div
    ref={containerRef}
    className={`dsa-roadmap-canvas${dragging ? " dragging" : ""}`}
    aria-label="Interactive DSA roadmap. Drag to pan and use the controls to zoom."
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={endDrag}
    onPointerCancel={endDrag}
    onWheel={handleWheel}
  >
    <div className="dsa-roadmap-layer" style={{ width: layout.width, height: layout.height, transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})` }}>
      <svg width={layout.width} height={layout.height} aria-hidden="true"><defs><marker id="dsa-roadmap-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" /></marker></defs>{layout.edges.map((edge) => {
        const selected = Boolean(selectedId && selectedPath.has(edge.source) && selectedPath.has(edge.target));
        const hovered = Boolean(hoveredId && (edge.source === hoveredId || edge.target === hoveredId));
        return <path className={`dsa-roadmap-edge${selected ? " selected" : ""}${hovered ? " hovered" : ""}${selectedId && !selected ? " faded" : ""}`} d={edge.path} key={edge.id} />;
      })}</svg>
      {layout.nodes.map(({ topic, x, y }) => {
        const onPath = selectedPath.has(topic.id);
        const relatedToHover = hoveredId === topic.id || hoveredNeighbors.has(topic.id);
        return <RoadmapNode key={topic.id} topic={topic} x={x} y={y} questionCount={questionCounts[topic.id] ?? 0} selected={selectedId === topic.id} highlighted={onPath || relatedToHover} faded={Boolean(selectedId && !onPath)} onHover={setHoveredId} onSelect={() => { centerTopic(topic.id); onSelect(topic.id); }} />;
      })}
    </div>
    <div className="dsa-roadmap-canvas-controls" aria-label="Roadmap viewport controls">
      <button type="button" onClick={() => zoomBy(.12)} aria-label="Zoom in"><Plus size={15} /></button>
      <button type="button" onClick={() => zoomBy(-.12)} aria-label="Zoom out"><Minus size={15} /></button>
      <button type="button" onClick={fitView} aria-label="Fit roadmap to view"><Maximize2 size={14} /></button>
      <button type="button" onClick={fitView} aria-label="Reset roadmap viewport"><RotateCcw size={14} /></button>
    </div>
    <span className="dsa-roadmap-viewport-readout" aria-live="polite">{Math.round(viewport.scale * 100)}%</span>
  </div>;
}
