import Vue from "vue";
import Router from "vue-router";
import Main from "@/components/Main";
import ReviewValidation from "@/components/ReviewValidation";
import manualReview from "@/components/manualReview";
import Configure from "@/components/Configure";
import Comment from "@/components/comment";
// import About from "@/components/About";

Vue.use(Router);

export default new Router({
    base: '/zurich_extension_motor_client/',
    routes: [{
            path: "/",
            name: "Main",
            component: Main
        },
        {
            path: "/review_validation",
            name: "ReviewValidation",
            component: ReviewValidation
        },
        {
            path: "/manual_review",
            name: "ManualReview",
            component: manualReview
        },
        {
            path: "/configure",
            name: "Configure",
            component: Configure
        },
        {
            path: "/comment",
            name: "Comment",
            component: Comment
        }
    ]
});