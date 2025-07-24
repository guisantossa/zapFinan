import Navbar from "./Navbar";

export default function Layout({ ativo, children }) {
  return (
    <>
      <Navbar ativo={ativo} />
      <div className="p-6">{children}</div>
    </>
  );
}
