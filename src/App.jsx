import { useEffect, useState } from "react";
import TimeAgo from "react-timeago";
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
      // eslint-disable-next-line no-unused-vars
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

  const colorList = ["#007CBE", "#A7C957", "#BC4749", "#CD9FCC", "#791E94"];

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
      .order("activity_timestamp", { ascending: false })
      .limit(10);
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
    <>
      <h1 className="text-center display-4">Microservice :: Feluda</h1>
      <h4 className="text-center display-6">Activity Feed</h4>
      <hr />
      {user ? (
        <div className="mb-3 bg-primary p-3">
          <div className="container d-flex justify-content-between align-items-center px-6">
            <h2 className="mb-0 text-white">Welcome </h2>
            <div className="badge rounded-pill text-bg-primary pl-3 py-1">
              <h4
                className="text-white mr-4"
                style={{ display: "inline", marginRight: "10px" }}
              >
                @ <FontAwesomeIcon icon={faUser} /> {user}
              </h4>
              <button
                onClick={handleLogout}
                className="badge rounded-pill bg-white text-danger mr-4 hover ml-2"
              >
                <h5 className="text-danger" style={{ display: "inline" }}>
                  {" "}
                  Logout
                </h5>
              </button>
            </div>
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
      <div className="container">
        {user ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3 bg-light p-3">
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
            <table className="table table-responsive table-striped table-hover table-bordered">
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
                  // fade in transition
                  <tr
                    key={item.activity_id}
                    style={{
                      animation: `fadeIn ease 1s forwards ${index / 10 + 0.2}s`,
                    }}
                  >
                    <td>{index + 1}</td>
                    <td>
                      {item.activity_id}
                      {/* add span to top 3 items only */}
                      {index < 2 && (
                        <span
                          className="badge rounded-pill text-white"
                          // bg color from colorList array randomly but same in loop even odd from activity_id
                          style={{
                            backgroundColor:
                              colorList[
                                item.activity_id % 2 === 0
                                  ? item.activity_id % 5
                                  : item.activity_id % 4
                              ],
                            marginLeft: "5px",
                          }}
                        >
                          New
                        </span>
                      )}
                    </td>
                    <td>...{item.device_uuid.slice(-4)}</td>
                    <td>{item.activity_message}</td>
                    <td>
                      <TimeAgo date={item.activity_timestamp} />
                    </td>
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
    </>
  );
}

export default App;
