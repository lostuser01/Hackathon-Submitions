"use client";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Loader } from "@react-three/drei";
import { ScrollSections } from "@/components/ScrollSections";
import { SmoothScroll } from "@/components/SmoothScroll";
import { useScene } from "@/components/SceneContext";

export default function Home() {
  const { setSection } = useScene();

  // Reset to section 0 on mount
  useEffect(() => {
    setSection(0);
  }, [setSection]);

  return (
    <SmoothScroll>
      <main>
        <div className="bg-scanner" />
        <Navbar />
        <Loader />

        {/* Scrollable story content */}
        <ScrollSections onSectionChange={setSection} />
      </main>
    </SmoothScroll>
  );
}
