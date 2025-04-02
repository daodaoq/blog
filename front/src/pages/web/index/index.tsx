import React from "react";
import Hero from "../hero/hero";
import Home from "../home/home";
// import Work from "../work/work";
import WebNavbar from "@/components/layout/WebNavbar/WebNavbar";
import "./index.css";
import Calendar from "@/components/other/Calendar/Canlendar";
import TagCloud from "@/components/other/TagCloud/TagCloud";
import RecentComments from "@/components/other/RecentComments/RecentComments";

const Index: React.FC = () => {
  return (
    <div>
      <WebNavbar />
      <Hero />
      {/* <Work /> */}
      <div className="container">
        <div className="main">
          <Home />
        </div>
        <div className="side">
          <div className="card">
            <Calendar />
          </div>
          <div className="card">
            <TagCloud />
          </div>
          <div className="card">
            <RecentComments />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;