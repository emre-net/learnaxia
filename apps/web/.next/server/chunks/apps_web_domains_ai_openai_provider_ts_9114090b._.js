module.exports=[191633,660906,e=>{"use strict";e.i(889228);var t=e.i(91601);class a extends Error{code;details;constructor(e,t,a){super(t),this.code=e,this.details=a,this.name="AIError"}}e.s(["AIError",()=>a],660906);var n=e.i(469719),o=e.i(207064);let s=n.z.object({type:n.z.literal("FLASHCARD"),front:n.z.string(),back:n.z.string()}),r=n.z.object({type:n.z.literal("MC"),question:n.z.string(),options:n.z.array(n.z.string()),answer:n.z.string(),explanation:n.z.string().optional()}),i=n.z.object({type:n.z.literal("GAP"),text:n.z.string(),answers:n.z.array(n.z.string())}),l=n.z.object({type:n.z.literal("TRUE_FALSE"),statement:n.z.string(),answer:n.z.enum(["True","False"]),explanation:n.z.string().optional()});n.z.object({items:n.z.array(n.z.union([s,r,i,l]))});let c=n.z.object({isValid:n.z.boolean(),feedback:n.z.string().optional()}),u=n.z.object({questionText:n.z.string(),solution:n.z.string(),isQuestionPresent:n.z.boolean(),isReadable:n.z.boolean(),hasMultipleQuestions:n.z.boolean()}),d=n.z.object({title:n.z.string(),content:n.z.string(),peekingQuestion:n.z.object({question:n.z.string(),options:n.z.array(n.z.string()),answer:n.z.string(),explanation:n.z.string()}).optional()}),m=n.z.object({items:n.z.array(n.z.any())});class p{name="OpenAI";client;constructor(){this.client=new t.default({apiKey:process.env.GROQ_API_KEY,baseURL:"https://api.groq.com/openai/v1"})}async generateContent(e,t,n,s,r="tr"){if(!process.env.GROQ_API_KEY)throw new a("AUTH_ERROR","Groq API key is missing. Please add GROQ_API_KEY to your env.");let i=e.length>200,l=-1===n?"Determine the optimal number of items to generate based on the density of the provided text (minimum 3, maximum 30).":`Generate exactly ${n} study items.`,u="Extract content evenly and comprehensively across the provided text.";"detailed"===s?u="Perform a deep, granular extraction. Focus on very specific details, intricate facts, and subtle nuances described in the text.":"key_concepts"===s?u="Focus heavily on the most emphasized, bolded, or repeated core concepts. Ignore minor details and prioritize major themes and definitions.":"summary"===s?u="Provide a high-level summary extraction. Focus on the overarching narrative and broad takeaways rather than specific data points.":"auto"===s&&(u="Autonomously determine the best extraction strategy based on the tone and structure of the provided text.");let d=`
            You are an expert educational content generator.
            ${i?"Your task is to EXTRACT key concepts from the following user notes/documents and turn them into study items.":"Your task is to GENERATE study items about the following topic."}
            
            Extraction Focus / Strategy: 
            ${u}

            IMPORTANT: You MUST return all content and items within the JSON in this language: ${r.toUpperCase()}. If it is 'tr', translate and write entirely in Turkish.

            Instruction: ${l}
            Types to generate: ${t.join(", ")}.
            
            Return JSON in this format:
            {
                "items": [
                    { "type": "TYPE", "content": { ... }, "sourceContext": "optional short quote/concept source" }
                ]
            }
        `,p=[],h="",g=crypto.randomUUID();for(let n=0;n<=1;n++){let s=h?`${d}

PREVIOUS ATTEMPT FEEDBACK: The previous generation had issues. Please fix them. Feedback: ${h}`:d;try{let a,r,u,d=(await this.client.chat.completions.create({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:s},{role:"user",content:i?`Extract from this content:

${e}`:`Generate content for topic: ${e}`}],response_format:{type:"json_object"}})).choices[0].message.content||"{}";try{a=JSON.parse(d),r=m.parse(a)}catch(e){throw await o.default.systemLog.create({data:{requestId:g,level:"ERROR",environment:"production",service:"ai",message:`JSON Parsing veya Schema Doğrulama Hatası (Attempt ${n})`,source:"SERVER",metadata:{attempt:n,rawResponse:d,error:e.message}}}).catch(()=>{}),e}if(p=r.items,1===n){console.log("[Checker AI] Max retries reached. Returning generated items.");break}let y=`
                    You are an elite educational content reviewer (Checker AI).
                    Your job is to review the generated study items against the user's original ${i?"source text":"topic"}.
                    
                    Original Input:
                    ${e}

                    Requirements:
                    1. Items must be directly relevant and factually accurate based on the original input.
                    2. Count constraints must be met (Instruction: ${l}).
                    3. Types requested must be honored (${t.join(", ")}).
                    
                    Respond ONLY in JSON format:
                    {
                        "isValid": boolean,
                        "feedback": "string, leave empty if true. if false, clearly list mistakes and precise instructions on what to change."
                    }
                `,f=await this.client.chat.completions.create({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:y},{role:"user",content:`Review these generated items:

${JSON.stringify(p,null,2)}`}],response_format:{type:"json_object"}});try{let e=JSON.parse(f.choices[0].message.content||"{}");u=c.parse(e)}catch(e){console.warn(`[Checker AI] Malfunctioned or output invalid JSON on attempt ${n}. Forcing retry.`),u={isValid:!1,feedback:"The evaluation system could not process your output. Please ensure strict JSON compliance and factual accuracy."}}if(await o.default.systemLog.create({data:{requestId:g,level:u.isValid?"INFO":"WARN",environment:"production",service:"ai",message:u.isValid?`AI Generation Loop Completed Successfully (Attempt ${n})`:`Checker AI Requested Adjustments (Attempt ${n})`,source:"SERVER",metadata:{attempt:n,isExtraction:i,generatorInput:e,generatorSystemPrompt:s,generatorOutput:p,checkerFeedback:u.feedback||"Valid"}}}).catch(e=>console.error("AI Logging Failed:",e)),u.isValid){console.log(`[Checker AI] Content approved on attempt ${n}.`);break}console.log(`[Checker AI] Content rejected on attempt ${n}. Feedback:`,u.feedback),h=u.feedback||"Generated items did not meet quality standards. Completely rewrite them."}catch(e){if(console.error(`OpenAI Generation Error (Attempt ${n}):`,e),await o.default.systemLog.create({data:{requestId:g,level:"ERROR",environment:"production",service:"ai",message:`Generator Loop Crashed (Attempt ${n})`,source:"SERVER",stack:e.stack,metadata:{attempt:n,errorMessage:e.message}}}).catch(()=>{}),1===n)throw new a("UNKNOWN",e.message||"AI generation failed after retries");h=`Previous generation failed with error: ${e.message}. Please generate valid JSON.`}}return p}async analyzeImage(e,t,n="tr"){if(!process.env.GROQ_API_KEY)throw new a("AUTH_ERROR","Groq API key is missing. Please add GROQ_API_KEY to your env.");let o=e.toString("base64"),s=`
            You are an elite educational tutor. Analyze the image and provide the question text and solution.
            
            IMPORTANT: Provide the "questionText" and "solution" natively in this language: ${n.toUpperCase()}. If it is 'tr', output them strictly in Turkish.
            
            Respond ONLY in JSON format:
            {
                "questionText": "...",
                "solution": "...",
                "isQuestionPresent": true/false,
                "isReadable": true/false,
                "hasMultipleQuestions": true/false
            }
        `;try{let e=await this.client.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:s},{role:"user",content:[{type:"text",text:"Analyze and solve the question in this image."},{type:"image_url",image_url:{url:`data:${t};base64,${o}`,detail:"high"}}]}],response_format:{type:"json_object"}}),n=JSON.parse(e.choices[0].message.content||"{}"),r=u.parse(n);if(!r.isReadable)throw new a("VISION_FAILED","Image is not readable");if(!r.isQuestionPresent)throw new a("VISION_FAILED","No question found in image");return{questionText:r.questionText,solution:r.solution,metadata:{hasMultipleQuestions:r.hasMultipleQuestions}}}catch(e){if(e instanceof a)throw e;throw console.error("OpenAI Vision Error:",e),new a("UNKNOWN",e.message||"Vision analysis failed")}}async generateJourneySlide(e,t,n,o="tr"){if(!process.env.GROQ_API_KEY)throw new a("AUTH_ERROR","Groq API key is missing. Please add GROQ_API_KEY to your env.");let s=`
            You are an expert tutor creating an interactive learning module.
            Your task is to generate ONE comprehensive learning slide (section) about "${e}" which is part of the broader subject "${t}".
            The requested depth is "${n}".
            
            IMPORTANT RULES FOR LANGUAGE:
            1. You MUST generate all text content EXCLUSIVELY in the following language: ${o.toUpperCase()}.
            2. If the language is 'tr' (Turkish), you must write PURELY in Turkish without any mixed English terms.
            3. DO NOT mix languages (e.g., do not write "temeldefinitionsını").
            4. ABSOLUTELY NO Chinese, Japanese, or any other foreign characters/alphabets. Output must be clean and grammatically perfect.
            
            1. Provide a clear, engaging "title" for the slide.
            2. Write the "content" in rich HTML format. Use semantic tags (<h2>, <p>, <ul>, <li>, <strong>, <em>). Make it highly readable and engaging, suitable for a learning app. Add brief examples if appropriate.
            3. Provide a "peekingQuestion". This is a single multiple-choice question to test the user's understanding of this specific slide's content before they can proceed.
            
            Respond ONLY in valid JSON matching this schema:
            {
                "title": "string",
                "content": "<p>Rich html formatted text...</p>",
                "peekingQuestion": {
                    "question": "string",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer": "Exact string of the correct option",
                    "explanation": "Why this is correct"
                }
            }
        `;try{let t=(await this.client.chat.completions.create({model:"llama-3.3-70b-versatile",messages:[{role:"system",content:s},{role:"user",content:`Generate the slide for topic: ${e}`}],response_format:{type:"json_object"}})).choices[0].message.content||"{}";return d.parse(JSON.parse(t))}catch(e){throw console.error("Slide Generation Error:",e),new a("UNKNOWN",e.message||"Slide generation failed")}}}e.s(["OpenAIAIProvider",()=>p],191633)}];

//# sourceMappingURL=apps_web_domains_ai_openai_provider_ts_9114090b._.js.map