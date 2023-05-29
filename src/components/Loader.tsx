import React            from "react";
import { useSelector }  from "react-redux";
import { RootState }    from "../redux/store";

import "./../css/Loader.css"

const Loader: React.FC = () => {
  const isLoading = useSelector((state: RootState) => state.loader.isLoading);

  return (
    <div className={`glassjar__loader${isLoading ? " visible" : ""}`}>
      <h1>
        <i className="fa-solid fa-circle-notch fa-spin"></i>
      </h1>
    </div>
  );
};

export default Loader;
