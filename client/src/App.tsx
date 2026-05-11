import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

function Router() {
  return (
    <Switch>
      {/* Home Page */}
      <Route path="/" component={Home} />
      
      {/* Your 9-brand dashboard portal */}
      <Route path="/dashboard" component={Dashboard} />

      {/* Simplified Fallback - No external file needed */}
      <Route>
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">404: Page Not Found</h1>
        </div>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <Router />
  );
}