import Image from "next/image";
import noData from "@assets/dapp/noDataRoom.png";

const NoDataRoom = () => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Image src={noData} alt="No Data" />
    </div>
  );
};

export default NoDataRoom;
