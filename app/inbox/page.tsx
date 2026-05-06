
import ChatMainNav from "@/src/components/chatMainNav";
import MobileNavbar from "@/src/components/mobileNavbar";


const page = () => {
  return (
    <div className="md:min-h-screen bg-InboxBg bg-no-repeat bg-center bg-cover">
      <div className=" container">
        <div className=" max-lg:hidden">
          <ChatMainNav />
        </div>
        <div className="lg:hidden">
          <MobileNavbar />
        </div>
       
      </div>
    </div>
  );
};

export default page;
