import Image from "next/image";
import logo from "@assets/mobile/samlllogo.svg";
import create from "@assets/mobile/createbtn.svg";
import profile from "@assets/mobile/profile.png";

const MobileNavbar = () => {
  return (
    <div className=" container  flex justify-between items-center ">
      <div>
        <Image src={logo} alt="logo" />
      </div>
      <div className="max-w-[100px] flex items-center w-full">
        <div>
          <Image src={create} alt="create" className="mb-[10px]" />
        </div>
        <div>
          <Image src={profile} alt="profile" />
        </div>
      </div>
    </div>
  );
};

export default MobileNavbar;
