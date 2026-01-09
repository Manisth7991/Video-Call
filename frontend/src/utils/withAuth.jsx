import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"
import axios from "axios";
import server from "../environment";

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const router = useNavigate();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      const checkAuthentication = async () => {
        try {
          const response = await axios.get(`${server}/api/v1/users/check-auth`, {
            withCredentials: true
          });

          if (!response.data.authenticated) {
            router("/auth");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          router("/auth");
        } finally {
          setIsChecking(false);
        }
      };

      checkAuthentication();
    }, [router]);

    if (isChecking) {
      return <div>Loading...</div>; // Or a loading spinner
    }

    return <WrappedComponent {...props} />;
  }
  return AuthComponent;
}
export default withAuth;