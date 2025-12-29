import AuthPanel from "./components/AuthPanel.jsx";
import BoardPanel from "./components/BoardPanel.jsx";
import CommentPanel from "./components/CommentPanel.jsx";
import MyPagePanel from "./components/MyPagePanel.jsx";
import CategoryPanel from "./components/CategoryPanel.jsx";
import BoardPage from "./pages/BoardPage.jsx";

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>onebyte test front</h1>
      {/* <AuthPanel />
      <MyPagePanel />
      <hr />
      <CategoryPanel />
      <BoardPanel />
      <CommentPanel /> */}
      <BoardPage />
    </div>
  );
}
