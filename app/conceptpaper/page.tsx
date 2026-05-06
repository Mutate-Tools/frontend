import PDFViewer from "@/src/components/pdf-viewer";


const Whitepaper = () => {
  return (
    <div>
      <PDFViewer path="/docs/conceptpaper.pdf" />
    </div>
  );
};

export default Whitepaper;