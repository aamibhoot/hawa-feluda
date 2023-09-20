import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import "./App.css";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function App() {
  const [data, setData] = useState([]);
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  // Function to handle login
  const setUname = async () => {
    try {
      let { data: profiles, e } = await supabase
        .from("profiles")
        .select("uname");

      if (e) {
        throw e;
      }

      console.log("Login success:", profiles[0].uname);
      setUser(profiles[0].uname);
    } catch (error) {
      console.error("Login error:", error.message);
    }
  };
  const handleLogin = async (email, password) => {
    try {
      const { user, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      setUname();
      getActivities();
    } catch (error) {
      console.error("Login error:", error.message);
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      setUser(null);
      getActivities();
      console.log("Logout success");
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  useEffect(() => {
    // check if user is logged in
    setUname();
    getActivities();
    getDevices();
    setupRealtimeListener();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function getActivities() {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("activity_timestamp", { ascending: false });
    setData(data);
  }

  // get devices list
  async function getDevices() {
    const { data: devices, error } = await supabase.from("devices").select("*");
    if (error) {
      throw error;
    }
    console.log(devices);
    setDevices(devices);
  }

  function setupRealtimeListener() {
    supabase
      .channel("custom-insert-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          console.log("Change received!", payload);
          getActivities();
        }
      )
      .subscribe();
  }
  console.log(data);
  return (
    <div className="container mt-5">
      <h1 className="text-center mb-5">Microservice :: Feluda</h1>
      {user ? (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Welcome </h2>
          <div className="badge rounded-pill text-bg-primary pl-3 py-1">
            <span className="text-white">
              @ <FontAwesomeIcon icon={faUser} /> {user}
            </span>
            <button
              onClick={handleLogout}
              className="badge rounded-pill bg-white text-danger mr-4"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Login</h2>
          <button
            onClick={() => handleLogin("apon@hawa.com", "apon")}
            className="btn btn-primary"
          >
            Login
          </button>
        </div>
      )}
      {user ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0">Devices</h2>
            <ul className="list-group">
              {devices.map((item) => (
                <li
                  key={item.uuid}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  {item.uuid}
                  <span className="badge rounded-pill bg-white text-danger">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Activity ID</th>
                <th>Device ID</th>
                <th>Activity Message</th>
                <th>Activity Timestamp</th>
                <th>Activity Type</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.activity_id}>
                  <td>{index + 1}</td>
                  <td>{item.activity_id}</td>
                  {/* show last 4 */}
                  <td>...{item.device_uuid.slice(-4)}</td>
                  <td>{item.activity_message}</td>
                  <td>{item.activity_timestamp}</td>
                  <td>{item.activity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mb-0">Please login to see activities</p>
        </div>
      )}
    </div>
  );
}

export default App;
