"use client";

import React, {  useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/src/components/navbar";
import MouseGlow from "@/src/components/mouseGlow";
import LoaderHome from "@/src/components/loader";
import Hero from "./(home)/hero";
import Bult from "./(home)/bult";
import StatsSection from "./(home)/statsSection";
import ReferralProgram from "./(home)/referralProgram";
import Tokenomics from "./(home)/tokenomics";
import Architecture from "./(home)/architecture";
import Roadmap from "./(home)/roadmap";
import Faqs from "./(home)/faqs";
import Footer from "./(home)/footer";
import TabletArchitecture from "./(home)/tabletArchitecture";
import MobileArchitecture from "./(home)/mobileArchitecture";

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);
 useEffect(() => {
    const videoCached = localStorage.getItem("heroVideoLoaded");


    if (videoCached === "true") {
      setLoading(false);
      return;
    }


    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);


  return (
    <>

      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 "
          >
            <LoaderHome />
          </motion.div>
        )}
      </AnimatePresence>


      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative max-lg:overflow-hidden"
      >
        <MouseGlow />

        <motion.div className="fixed inset-x-0 top-0 z-[99] backdrop-blur-lg bg-black/30">
          <Navbar />
        </motion.div>


        <Hero  />

        <Bult />
        <StatsSection />
        <ReferralProgram />
        <Tokenomics />
         <div className="max-lg:hidden">
            <Architecture />
          </div>
          <div className="lg:hidden max-md:hidden">
            <TabletArchitecture />
          </div>
          <div className="md:hidden">
            <MobileArchitecture />
          </div>


          <section className="container mx-auto py-[20px] mt-16">
            <h2 className="text-[#9AA4C7] font-spaceGrotesk text-[18px] xl:text-[20px] max-lg:text-center mb-8">
              <span>{'// '}</span> Roadmap
            </h2>
            <Roadmap />
          </section>


          <Faqs />
          <Footer />
      </motion.main>
    </>
  );
};

export default Home;
