import React, { useCallback, useEffect, useState } from "react";
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import { scanImage } from "./lib/scanPipeline.js";
import { renderPdfPages } from "./lib/pdf.js";
import { loadImage, drawRedacted, canvasToBlob } from "./lib/redact.js";
import jsPDF from "jspdf";
import JSZip from "jszip";
import "./App.css";

function addDocText(doc, y, margin, maxWidth, text, options = {}) {
  const { size = 12, style = "normal", marginTop = 12 } = options;
  const nextY = y + marginTop;
  doc.setFontSize(size);
  doc.setFont(undefined, style);
  const split = doc.splitTextToSize(text, maxWidth);
  doc.text(split, margin, nextY);
  return nextY + split.length * (size * 1.2);
}

function writePrivacySummary(doc, scan, margin, maxWidth) {
  let y = margin;

  y = addDocText(doc, y, margin, maxWidth, "PRIVACYGUARD AI — PRIVACY REPORT", { size: 18, style: "bold", marginTop: 0 });
  y = addDocText(doc, y, margin, maxWidth, `File: ${scan.fileName || "screenshot.png"}`, { size: 11, marginTop: 16 });
  y = addDocText(doc, y, margin, maxWidth, `Generated: ${new Date().toLocaleString()}`, { size: 11 });
  y = addDocText(doc, y, margin, maxWidth, `Privacy Risk Score: ${scan.risk.score}/100 (${scan.risk.tier})`, { size: 12, style: "bold", marginTop: 18 });
  y = addDocText(doc, y, margin, maxWidth, "Explanation:", { size: 12, style: "bold" });
  y = addDocText(doc, y, margin, maxWidth, scan.risk.explanation, { size: 11, marginTop: 6 });

  return y;
}

export default function App() {
  const [page, setPage] = useState("home");

  const CUSTOM_RULES_STORAGE_KEY = "privacyguard-custom-rules";

  const [scans, setScans] = useState([]);
  const [scanQueue, setScanQueue] = useState([]);
  const [currentScan, setCurrentScan] = useState(0);
  const [scanTotal, setScanTotal] = useState(0);
  const [highlightedCategory, setHighlightedCategory] = useState(null);
  const [customRules, setCustomRules] = useState(() => {
    try {
      const stored = window.localStorage.getItem(CUSTOM_RULES_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return parsed.map((rule) => ({
        ...rule,
        test: rule.pattern
          ? (joined) => new RegExp(rule.pattern, rule.flags || "i").test(joined)
          : rule.test,
      }));
    } catch {
      return [];
    }
  });
  const [ocrLanguage, setOcrLanguage] = useState("eng");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [status, setStatus] = useState("idle"); // idle | processing | done | error
  const [progress, setProgress] = useState({ ocr: 0, qr: 0, faces: 0, pii: 0 });
  const [progressStage, setProgressStage] = useState(null);
  const [error, setError] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []).filter(
      (file) => file.type.startsWith("image/") || file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );
    if (files.length === 0) return;

    setError(null);
    setStatus("processing");
    setProgress({ ocr: 0, qr: 0, faces: 0, pii: 0 });
    setProgressStage(null);
    setShowOriginal(false);
    setScans([]);
    setCurrentScan(0);

    try {
      const entries = [];

      for (const file of files) {
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const pages = await renderPdfPages(file, 1.25);
          for (const page of pages) {
            const pageBlob = await canvasToBlob(page.canvas, "image/png");
            if (!pageBlob) continue;
            const pageSource = URL.createObjectURL(pageBlob);
            entries.push({
              source: pageSource,
              file,
              fileName: `${file.name} (page ${page.pageNumber})`,
            });
          }
        } else {
          entries.push({ source: file, file, fileName: file.name });
        }
      }

      if (entries.length === 0) {
        throw new Error("No valid files to process.");
      }

      setScanTotal(entries.length);
      setScanQueue(entries.map((entry) => entry.fileName));

      const scanned = [];

      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        setCurrentScan(index);
        setProgressStage("ocr");
        setProgress((prev) => ({ ...prev, ocr: 0, qr: 0, faces: 0, pii: 0 }));

        const img = await loadImage(entry.source);
        const { matches: found, risk: riskReport } = await scanImage(entry.source, img, (stage, pct) => {
          setProgressStage(stage);
          setProgress((prev) => ({ ...prev, [stage]: pct }));
        }, {
          customPatterns: customRules,
          ocrLanguage,
        });

        scanned.push({
          file: entry.file,
          fileName: entry.fileName,
          img,
          matches: found,
          selectedKeys: new Set(found.map((m) => m.key)),
          risk: riskReport,
        });

        setScans([...scanned]);

        if (typeof entry.source === "string") {
          URL.revokeObjectURL(entry.source);
        }
      }

      setStatus("done");
      setPage("results");
    } catch (err) {
      console.error(err);
      setError("Couldn't process those files. Try clearer screenshots (PNG/JPG) or a valid PDF.");
      setStatus("error");
      setProgressStage(null);
      setProgress({ ocr: 0, qr: 0, faces: 0, pii: 0 });
    }
  }, [customRules, ocrLanguage]);

  const handleCategoryShortcut = useCallback((categoryId) => {
    setHighlightedCategory(categoryId);
    setScans((prev) =>
      prev.map((scan, index) => {
        if (index !== currentScan) return scan;
        const selectedKeys = new Set(
          scan.matches.filter((m) => m.id === categoryId).map((m) => m.key)
        );
        return { ...scan, selectedKeys };
      })
    );
    setPage("results");
  }, [currentScan]);

  const handleFeatureClick = useCallback(
    (categoryId) => {
      if (status === "done" && scans.length > 0) {
        handleCategoryShortcut(categoryId);
      } else {
        setPage("upload");
      }
    },
    [handleCategoryShortcut, scans.length, status]
  );

  const copyRedactedImage = useCallback(async () => {
    const scan = scans[currentScan];
    if (!scan?.img) return;
    const active = scan.matches.filter((m) => scan.selectedKeys.has(m.key));
    const canvas = document.createElement("canvas");
    drawRedacted(canvas, scan.img, active);
    const blob = await canvasToBlob(canvas);
    if (!blob || !navigator.clipboard?.write) {
      setError("Clipboard copy is not supported in this browser.");
      return;
    }

    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch (err) {
      console.error(err);
      setError("Could not copy the image to clipboard. Please try again.");
    }
  }, [currentScan, scans]);

  const addCustomRule = useCallback((rule) => {
    setCustomRules((prev) => [...prev, rule]);
  }, []);

  const removeCustomRule = useCallback((ruleId) => {
    setCustomRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  }, []);


  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    if (!customRules) return;
    try {
      const serializable = customRules.map(({ id, label, pattern, flags, color, maxWindow, lowPriority }) => ({
        id,
        label,
        pattern,
        flags,
        color,
        maxWindow,
        lowPriority,
      }));
      window.localStorage.setItem(CUSTOM_RULES_STORAGE_KEY, JSON.stringify(serializable));
    } catch (err) {
      console.error("Failed to persist custom rules", err);
    }
  }, [customRules]);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const toggleMatch = useCallback(
    (key) => {
      setScans((prev) =>
        prev.map((scan, index) => {
          if (index !== currentScan) return scan;
          const next = new Set(scan.selectedKeys);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return { ...scan, selectedKeys: next };
        })
      );
    },
    [currentScan]
  );

  const blurAll = useCallback(() => {
    setScans((prev) =>
      prev.map((scan, index) => {
        if (index !== currentScan) return scan;
        return { ...scan, selectedKeys: new Set(scan.matches.map((m) => m.key)) };
      })
    );
  }, [currentScan]);

  const blurNone = useCallback(() => {
    setScans((prev) =>
      prev.map((scan, index) => {
        if (index !== currentScan) return scan;
        return { ...scan, selectedKeys: new Set() };
      })
    );
  }, [currentScan]);

  const handleDownloadImage = useCallback(async () => {
    const scan = scans[currentScan];
    if (!scan?.img) return;
    const active = scan.matches.filter((m) => scan.selectedKeys.has(m.key));
    const canvas = document.createElement("canvas");
    drawRedacted(canvas, scan.img, active);
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redacted-${scan.fileName || "screenshot"}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentScan, scans]);

  const handleDownloadReport = useCallback(() => {
    const scan = scans[currentScan];
    if (!scan?.risk) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    writePrivacySummary(doc, scan, margin, maxWidth);

    const addText = (text, options = {}) => {
      const { size = 12, style = "normal", marginTop = 12 } = options;
      let y = margin + 240;
      const split = doc.splitTextToSize(text, maxWidth);
      doc.setFontSize(size);
      doc.setFont(undefined, style);
      doc.text(split, margin, y + (marginTop - 12));
    };

    addText("Breakdown:", { size: 12, style: "bold", marginTop: 16 });

    scan.risk.breakdown.forEach((b) => {
      addText(`• ${b.id}: ${b.count} occurrences, weight ${b.weight}, contribution +${b.contribution}`, { size: 11, marginTop: 8 });
    });

    addText("", { marginTop: 18 });
    addText("Scanned entirely on-device. No image data was uploaded to any server.", { size: 10, marginTop: 8 });

    doc.save(`privacyguard-report-${scan.fileName || "details"}.pdf`);
  }, [currentScan, scans]);

  const handleDownloadPackage = useCallback(async () => {
    const scan = scans[currentScan];
    if (!scan?.img) return;
    const active = scan.matches.filter((m) => scan.selectedKeys.has(m.key));
    const canvas = document.createElement("canvas");
    drawRedacted(canvas, scan.img, active);
    const imageBlob = await canvasToBlob(canvas, "image/png");
    if (!imageBlob) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    writePrivacySummary(doc, scan, margin, maxWidth);
    doc.addPage();
    const imgData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(imageBlob);
    });
    doc.addImage(imgData, "PNG", margin, margin, pageWidth - margin * 2, doc.internal.pageSize.getHeight() - margin * 2);
    const pdfBlob = doc.output("blob");

    const zip = new JSZip();
    zip.file(`redacted-${scan.fileName || "screenshot"}.png`, imageBlob);
    zip.file(`privacyguard-report-${scan.fileName || "details"}.pdf`, pdfBlob);

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `privacyguard-package-${scan.fileName || "details"}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentScan, scans]);

  const reset = () => {
    setScans([]);
    setScanQueue([]);
    setCurrentScan(0);
    setScanTotal(0);
    setHighlightedCategory(null);
    setStatus("idle");
    setError(null);
    setPage("upload");
  };

  return (
    <div className="app">
      <Nav
        page={page}
        setPage={setPage}
        hasScan={status === "done"}
        isOnline={isOnline}
        deferredPrompt={deferredPrompt}
        onPromptInstall={promptInstall}
      />

      <main className="app__main">
        {page === "home" && <Home goToUpload={() => setPage("upload")} onFeatureClick={handleFeatureClick} />}

        {page === "upload" && (
          <UploadPage
            onFiles={handleFiles}
            customRules={customRules}
            onAddCustomRule={addCustomRule}
            onRemoveCustomRule={removeCustomRule}
            ocrLanguage={ocrLanguage}
            setOcrLanguage={setOcrLanguage}
            status={status}
            progress={progress}
            progressStage={progressStage}
            error={error}
            scanIndex={Math.min(currentScan + 1, scanTotal || 1)}
            scanTotal={scanTotal || 1}
            scanQueue={scanQueue}
            currentScan={currentScan}
          />
        )}

        {page === "results" && status === "done" && scans[currentScan] && (
          <ResultsPage
            image={scans[currentScan].img}
            matches={scans[currentScan].matches}
            risk={scans[currentScan].risk}
            selectedKeys={scans[currentScan].selectedKeys}
            onToggleMatch={toggleMatch}
            onBlurAll={blurAll}
            onBlurNone={blurNone}
            showOriginal={showOriginal}
            onToggleOriginal={() => setShowOriginal((v) => !v)}
            onDownload={handleDownloadImage}
            onCopy={copyRedactedImage}
            onRescan={reset}
            goToReport={() => setPage("report")}
            scanCount={scans.length}
            currentScan={currentScan}
            onSelectScan={setCurrentScan}
            scanNames={scans.map((scan) => scan.fileName)}
            onCategoryShortcut={handleCategoryShortcut}
            highlightedCategory={highlightedCategory}
          />
        )}

        {page === "report" && status === "done" && scans[currentScan] && (
          <ReportPage
            risk={scans[currentScan].risk}
            matches={scans[currentScan].matches}
            fileName={scans[currentScan].fileName}
            onDownloadReport={handleDownloadReport}
            onDownloadPackage={handleDownloadPackage}
            goToResults={() => setPage("results")}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
