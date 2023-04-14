import React            from "react";
import { useSelector }  from "react-redux";
import { RootState }    from "../redux/store";

const Loader: React.FC = () => {
  const isLoading = useSelector((state: RootState) => state.loader.isLoading);

  if (!isLoading) {
    return null;
  }

  return <div>Loading...</div>;
};

export default Loader;
