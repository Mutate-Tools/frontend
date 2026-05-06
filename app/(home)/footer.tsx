import Image from "next/image";
import logo from "@assets/logo.svg";
import TWITTER from "@assets/twitter.svg";
import TG from "@assets/telgram.svg";
import dext from "@assets/dext.svg";
import etherscan from "@assets/etherscan.svg";
import uri from "@/src/constants/external-links";
import Link from "next/link";
const Footer = () => {
  const handleScrollTo = (id: string): void => {
    const section: HTMLElement | null = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  return (
    <div className=" py-[50px] flex md:flex-row flex-col justify-between container">
      <div className=" max-md:mx-auto max-md:flex flex-col justify-center items-center  w-full">
        <div>
          <Image src={logo} alt="logo" />
        </div>
        <span className=" text-white/20 font-spaceGrotesk ">
          Built to mutate. Designed to disappear.
        </span>
        <div className="  gap-[10px] mt-[10px] flex">
          <div>
            <Image
              onClick={() => window.open(uri.TWITTER, "_blank")}
              src={TWITTER}
              alt="twitter"
              className="cursor-pointer"
            />
          </div>
          <div>
            <Image
              onClick={() => window.open(uri.TG, "_blank")}
              src={TG}
              alt="twitter"
              className="cursor-pointer"
            />
          </div>
          <div>
            <Image
              onClick={() => window.open(uri.dext, "_blank")}
              src={dext}
              alt="twitter"
              className="cursor-pointer"
            />
          </div>
          <div>
            <Image
              onClick={() => window.open(uri.etherscan, "_blank")}
              src={etherscan}
              alt="twitter"
              className="cursor-pointer"
            />
          </div>









        </div>
      </div>
      <div className=" md:max-w-[360px] max-w-[400px] max-md:mx-auto  md:flex-row flex-col  flex justify-between w-full">
        <div className=" max-md:hidden md:max-w-[200px] max-md:mx-auto  w-full">
          <h2 className=" text-[20px]  font-spaceGrotesk text-white max-md:text-center">
            Menu
          </h2>
          <div className=" max-md:flex gap-[10px] flex-wrap justify-center">
            <h5
              onClick={() => {
                handleScrollTo("overview");
              }}
              className=" text-[16px] font-spaceGrotesk  cursor-pointer text-white/20"
            >
              About Us
            </h5>

            <h5
              onClick={() => {
                handleScrollTo("system ");
              }}
              className=" text-[16px] font-spaceGrotesk  cursor-pointer text-white/20"
            >
              System Architecture
            </h5>
            <h5
              onClick={() => {
                handleScrollTo("roadmap");
              }}
              className=" text-[16px] font-spaceGrotesk  cursor-pointer text-white/20"
            >
              Roadmap
            </h5>








          </div>
        </div>
        <div className=" max-w-[151px]  max-lg:mx-auto max-lg:flex flex-col justify-center items-center  max-md:mt-[20px] max-md:mx-auto w-full">
          <h2 className=" text-[20px] mb-[10px] font-spaceGrotesk text-white  max-md:text-center">
            Docs
          </h2>
          <Link
            href="conceptpaper"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer  px-[10px] text-[14px] text-center text-white border-[#FFFFFF80] border-[1px] rounded-full py-[5px] lg:text-[16px] font-spaceGrotesk max-md:text-center hover:text-white transition"
          >
            Concept Paper
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Footer;
