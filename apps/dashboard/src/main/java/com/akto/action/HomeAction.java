package com.akto.action;

import com.akto.utils.Auth0;
import com.akto.utils.DashboardMode;
import com.auth0.AuthorizeUrl;
import com.auth0.SessionUtils;
import com.google.api.client.repackaged.org.apache.commons.codec.binary.Base64;
import com.mongodb.BasicDBObject;
import com.opensymphony.xwork2.Action;
import org.apache.struts2.interceptor.ServletRequestAware;
import org.apache.struts2.interceptor.ServletResponseAware;
import org.apache.struts2.interceptor.SessionAware;
import org.jetbrains.annotations.Nullable;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

// This is the first action that is triggered when the webpage is first fetched
// Basically sets the access token from the session (saved by UserDetailsFilter)
// Then the accessToken is accessed by login.jsp (the page being requested)
// in ${accessToken} field.
public class HomeAction implements Action, SessionAware, ServletResponseAware, ServletRequestAware {

    protected HttpServletResponse servletResponse;

    @Override
    public void setServletResponse(HttpServletResponse httpServletResponse) {
        this.servletResponse = httpServletResponse;
    }

    protected HttpServletRequest servletRequest;

    public String verifyEmail(){
        return "SUCCESS";
    }
    @Override
    public String execute() {

        if(DashboardMode.isSaasDeployment()){
            //Use Auth0
            return redirectToAuth0(servletRequest, servletResponse, accessToken, new BasicDBObject());
//            if (SUCCESS1 != null) return SUCCESS1;
//            System.out.println("Executed home action for auth0");
//            return "SUCCESS";
        }
        // Use existing flow

        return "SUCCESS";
    }

    public static String redirectToAuth0(HttpServletRequest servletRequest, HttpServletResponse servletResponse, String accessToken,BasicDBObject state) {
        if(checkIfAccessTokenExists(servletRequest, accessToken)) {
            return "SUCCESS";
        }
        String redirectUri = servletRequest.getScheme() + "://" + servletRequest.getServerName();
        if ((servletRequest.getScheme().equals("http") && servletRequest.getServerPort() != 80) ||
                (servletRequest.getScheme().equals("https") && servletRequest.getServerPort() != 443)) {
            redirectUri += ":" + servletRequest.getServerPort();
        }
        redirectUri += "/callback";

        String authorizeUrlStr;
        try {
            Base64 base64Url = new Base64(true);
            AuthorizeUrl authorizeUrl = Auth0.getInstance().buildAuthorizeUrl(servletRequest, servletResponse, redirectUri)
                    .withScope("openid profile email");

            authorizeUrl.withState(base64Url.encodeAsString(state.toString().getBytes(StandardCharsets.UTF_8)));
            authorizeUrlStr = authorizeUrl.build();
            servletResponse.sendRedirect(authorizeUrlStr);
        } catch (Exception e) {
            System.err
                    .println("Couldn't create the AuthenticationController instance. Check the configuration.");
        }
        return null;
    }

    private static boolean checkIfAccessTokenExists(HttpServletRequest servletRequest, String accessToken) {
        return accessToken != null || SessionUtils.get(servletRequest, "accessToken") != null;
    }

    public String error() {
        return SUCCESS.toUpperCase();
    }

    private String accessToken;
    private String signupInvitationCode;
    private String signupEmailId;

    // to prevent redirect_uri not found warning
    public void setRedirect_uri(String redirect_uri) {
    }

    public String getAccessToken() {
        return accessToken;
    }

    @Override
    public void setSession(Map<String, Object> session) {
        this.accessToken = (String) session.get(AccessTokenAction.ACCESS_TOKEN_HEADER_NAME);
    }

    public void setSignupInvitationCode(String signupInvitationCode) {
        this.signupInvitationCode = signupInvitationCode;
    }

    public String getSignupInvitationCode() {
        return signupInvitationCode;
    }

    public String getSignupEmailId() {
        return signupEmailId;
    }

    public void setSignupEmailId(String signupEmailId) {
        this.signupEmailId = signupEmailId;
    }

    @Override
    public void setServletRequest(HttpServletRequest request) {
        this.servletRequest = request;
    }
}
