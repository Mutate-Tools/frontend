"use client";

import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useEffect, useState } from "react";
import Loader from "./loader";

type PDFViewerProps = {
  path: string;
};

const PDFViewer = ({ path }: PDFViewerProps) => {
  const [width, setWidth] = useState<number | undefined>();

  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return width ? (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
      <Viewer
        fileUrl={path}
        defaultScale={window.innerWidth > 850 ? 1.5 : 1}
        plugins={[defaultLayoutPluginInstance]}
        renderLoader={() => <Loader />}
      />
    </Worker>
  ) : (
    <Loader />
  );
};

export default PDFViewer;
