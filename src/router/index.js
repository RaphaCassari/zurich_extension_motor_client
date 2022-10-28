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
/*     mode: 'history',
    base: '/zurich_extension_motor_client/', */
    routes: [{
            path: "/zurich_extension_motor_client/",
            name: "Main",
            component: Main
        },
        {
            path: "/zurich_extension_motor_client/review_validation",
            name: "ReviewValidation",
            component: ReviewValidation
        },
        {
            path: "/zurich_extension_motor_client/manual_review",
            name: "ManualReview",
            component: manualReview
        },
        {
            path: "/zurich_extension_motor_client/configure",
            name: "Configure",
            component: Configure
        },
        {
            path: "/zurich_extension_motor_client/comment",
            name: "Comment",
            component: Comment
        }
    ]
});