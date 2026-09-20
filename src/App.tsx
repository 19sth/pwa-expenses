import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Main from './pages/main';
import About from './pages/about';
import Dashboard from './pages/dashboard';
import DailyExpenses from './pages/dailyExpenses';
import Categories from './pages/categories';
import Processes from './pages/processes';
import MuLayout from './components/mulayout';
import MuImportExport from './components/muimportexport';
import { ROUTE_PREFIX } from './utils/constants';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={`${ROUTE_PREFIX}/`} element={<MuLayout />}>
          <Route index element={<Main />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="daily" element={<DailyExpenses />} />
          <Route path="daily/:day" element={<DailyExpenses />} />
          <Route path="categories" element={<Categories />} />
          <Route path="processes" element={<Processes />} />
          <Route path="importexport" element={<MuImportExport />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
