import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://axyqgkpztopyffwpxitr.supabase.co";
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4eXFna3B6dG9weWZmd3B4aXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTQ1ODU0MTMsImV4cCI6MjAxMDE2MTQxM30.49slbQx9K8uYY90EyfPYCubn44aoEkYfcC-CzJCJ0KY'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const App = () => {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);

  // Function to update data state when new data is inserted
  const handleDataInsert = (newData) => {
    setData((prevData) => [newData, ...prevData]);
  };

  // Set up real-time listener when the user is authenticated
  useEffect(() => {
    const handleSession = async () => {
      try {
        const session = await supabase.auth.setSession();
        if (session) {
          setUser(session.user);
          setupRealtimeListener(); // Only set up the real-time listener when the user is authenticated
        }
      } catch (error) {
        console.error("Session error:", error.message);
      }
    };

    handleSession();
  }, []);

  // Function to handle login
  const handleLogin = async (email, password) => {
   try {
      const { user, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }
      console.log("Login success:", user);
      setUser(user);
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
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  // Function to fetch data
  const handleFetch = async () => {
    try {
      const { data, error } = await supabase.from("activities").select("*");

      if (error) {
        throw error;
      }

      setData(data);
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
  };

  // Function to set up real-time listener
  const setupRealtimeListener = () => {
    const subscription = supabase
      .from("activities")
      .on("INSERT", (payload) => {
        console.log("Change received!", payload);
        // Call the function to update the data state
        handleDataInsert(payload.new);
      })
      .subscribe();

    // Clean up the subscription when the component unmounts or when the user logs out
    return () => {
      subscription.unsubscribe();
    };
  };

  return (
    <div>
      {user ? (
        <div>
          <h2>Welcome, {user.email}</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <h2>Login</h2>
          <button onClick={() => handleLogin("apon@hawa.com", "apon")}>Login</button>
        </div>
      )}

      <h2>Fetch Data</h2>
      <button onClick={handleFetch}>Fetch</button>
      <ol>
        {data.map((activity) => (
          <li key={activity.activity_id}>
            <b>{activity.device_uuid}</b> {activity.activity_type} - {activity.activity_message}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default App;
