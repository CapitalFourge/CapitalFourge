package com.capitalfourge.portfoliomanager.infrastructure.config;

import io.grpc.netty.shaded.io.netty.channel.ChannelFutureListener;
import io.grpc.netty.shaded.io.netty.channel.ChannelHandlerContext;
import io.grpc.netty.shaded.io.netty.channel.ChannelInboundHandlerAdapter;
import io.grpc.netty.shaded.io.netty.handler.codec.http.*;
import io.grpc.netty.shaded.io.netty.buffer.Unpooled;
import io.grpc.netty.shaded.io.netty.util.CharsetUtil;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Handles HTTP/1.x health check requests (HEAD /, GET /health) on the gRPC port.
 * This allows Render's health checks to pass when they hit the gRPC port with HTTP/1.x requests.
 */
@Component
public class GrpcHttpHealthHandler extends ChannelInboundHandlerAdapter {

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        if (msg instanceof HttpRequest) {
            HttpRequest request = (HttpRequest) msg;
            
            // Handle HEAD / and GET /health (health check requests)
            if ((HttpMethod.HEAD.equals(request.method()) || HttpMethod.GET.equals(request.method()))
                    && ("/".equals(request.uri()) || "/health".equals(request.uri()))) {
                
                HttpResponse response = new DefaultFullHttpResponse(
                    HttpVersion.HTTP_1_1,
                    HttpResponseStatus.OK,
                    Unpooled.copiedBuffer("OK", StandardCharsets.UTF_8)
                );
                response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain; charset=UTF-8");
                response.headers().set(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
                response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.CLOSE);
                
                ctx.writeAndFlush(response).addListener(ChannelFutureListener.CLOSE);
                return;
            }
        }
        
        // Pass through to next handler (gRPC handler) for actual gRPC requests
        ctx.fireChannelRead(msg);
    }
    
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        cause.printStackTrace();
        ctx.close();
    }
}
