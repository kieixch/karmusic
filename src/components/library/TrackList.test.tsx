import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Track } from "@/types/track";
import { AppProviders } from "@/components/providers/AppProviders";
import { TrackList } from "./TrackList";

function makeTrack(overrides: Partial<Track>): Track {
  return {
    id: "local:test",
    source: "local",
    provider: "local",
    title: "Test track",
    artist: "Test artist",
    duration: 75,
    addedAt: 1,
    ...overrides,
  };
}

const tracks = [
  makeTrack({ id: "local:a", title: "First song", artist: "Artist one" }),
  makeTrack({
    id: "freetouse:b",
    source: "online",
    provider: "freetouse",
    title: "Second song",
    artist: "Artist two",
  }),
];

function renderList(ui: ReactNode) {
  return render(<AppProviders>{ui}</AppProviders>);
}

describe("TrackList", () => {
  it("renders track metadata, durations and source badges", () => {
    renderList(<TrackList tracks={tracks} />);

    expect(screen.getByText("First song")).toBeInTheDocument();
    expect(screen.getByText("Second song")).toBeInTheDocument();
    expect(screen.getAllByText("1:15")).toHaveLength(2);
    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(screen.getByText("Free To Use")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play First song" })).toBeInTheDocument();
  });

  it("hides source badges when requested", () => {
    renderList(<TrackList tracks={tracks} showSource={false} />);
    expect(screen.queryByText("Free To Use")).not.toBeInTheDocument();
  });

  it("calls onMove with the correct indexes and disables edge controls", () => {
    const onMove = vi.fn();
    renderList(<TrackList tracks={tracks} onMove={onMove} />);

    expect(screen.getByRole("button", { name: "Move First song up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Second song down" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Move First song down" }));
    expect(onMove).toHaveBeenCalledWith(0, 1);

    fireEvent.click(screen.getByRole("button", { name: "Move Second song up" }));
    expect(onMove).toHaveBeenLastCalledWith(1, 0);
  });

  it("renders nothing for an empty list", () => {
    renderList(<TrackList tracks={[]} />);
    expect(screen.queryByRole("list", { name: "Tracks" })).not.toBeInTheDocument();
  });
});
