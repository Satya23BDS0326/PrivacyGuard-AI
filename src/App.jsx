import React, { useCallback, useState } from "react";
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import { scanImage } from "./lib/scanPipeline.js";
import { loadImage, drawRedacted, canvasToBlob } from "./lib/redact.js";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("home");

  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [matches, setMatches] = useState([]);
  const [risk, setRisk] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [progress, setProgress] = useState({ ocr: 0, qr: 0, faces: 0, pii: 0 });
  const [progressStage, setProgressStage] = useState(null);
  const [error, setError] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleFile = useCallback(async (file) => {
    setError(null);
    setStatus("processing");
    setProgress({ ocr: 0, qr: 0, faces: 0, pii: 0 });
    setMatches([]);
    setRisk(null);
    setShowOriginal(false);
    setFileName(file.name);

    try {
      const img = await loadImage(file);
      setImage(img);

      const { matches: found, risk: riskReport } = await scanImage(file, img, (stage, pct) => {
        setProgressStage(stage);
        setProgress((prev) => ({ ...prev, [stage]: pct }));
      });

      setMatches(found);
      setSelectedKeys(new Set(found.map((m) => m.key))); // default: everything selected for blur
      setRisk(riskReport);
      setStatus("done");
      setPage("results");
    } catch (err) {
      console.error(err);
      setError("Couldn't process that image. Try a clearer screenshot (PNG/JPG).");
      setStatus("error");
    }
  }, []);

  const toggleMatch = useCallback((key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const blurAll = () => setSelectedKeys(new Set(matches.map((m) => m.key)));
  const blurNone = () => setSelectedKeys(new Set());

  const handleDownloadImage = useCallback(async () => {
    if (!image) return;
    const active = matches.filter((m) => selectedKeys.has(m.key));
    const canvas = document.createElement("canvas");
    drawRedacted(canvas, image, active);
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "redacted-screenshot.png";
    a.click();
    URL.revokeObjectURL(url);
  }, [image, matches, selectedKeys]);

  const handleDownloadReport = useCallback(() => {
    if (!risk) return;
    const lines = [
      "PRIVACYGUARD AI — PRIVACY REPORT",
      `File: ${fileName || "screenshot.png"}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      `Privacy Risk Score: ${risk.score}/100 (${risk.tier})`,
      "",
      "Explanation:",
      risk.explanation,
      "",
      "Breakdown:",
      ...risk.breakdown.map((b) => `  - ${b.id}: ${b.count} found, weight ${b.weight}, contributed +${b.contribution}`),
      "",
      "Scanned entirely on-device. No image data was uploaded to any server.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "privacyguard-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [risk, fileName]);

  const reset = () => {
    setImage(null);
    setMatches([]);
    setRisk(null);
    setStatus("idle");
    setError(null);
    setPage("upload");
  };

  return (
    <div className="app">
      <Nav page={page} setPage={setPage} hasScan={status === "done"} />

      <main className="app__main">
        {page === "home" && <Home goToUpload={() => setPage("upload")} />}

        {page === "upload" && (
          <UploadPage
            onFile={handleFile}
            status={status}
            progress={progress}
            progressStage={progressStage}
            error={error}
          />
        )}

        {page === "results" && status === "done" && (
          <ResultsPage
            image={image}
            matches={matches}
            risk={risk}
            selectedKeys={selectedKeys}
            onToggleMatch={toggleMatch}
            onBlurAll={blurAll}
            onBlurNone={blurNone}
            showOriginal={showOriginal}
            onToggleOriginal={() => setShowOriginal((v) => !v)}
            onDownload={handleDownloadImage}
            onRescan={reset}
            goToReport={() => setPage("report")}
          />
        )}

        {page === "report" && status === "done" && (
          <ReportPage
            risk={risk}
            matches={matches}
            fileName={fileName}
            onDownloadReport={handleDownloadReport}
            goToResults={() => setPage("results")}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
